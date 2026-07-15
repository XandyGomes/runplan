import { NextResponse } from 'next/server';
import { getAthleteId } from '@/lib/session';
import { generatePlan, ExperienceLevel } from '@/lib/planEngine';
import { mondayOfCurrentWeek, reviewPlanWithAI } from '@/lib/planReview';

export const dynamic = 'force-dynamic';

/**
 * Simula um plano SEM salvar nada no banco — pra o atleta conferir "e se eu tivesse
 * outro objetivo/nível/dias" sem substituir o plano ativo. Usa o mesmo motor
 * determinístico e a mesma revisão de IA do /api/plan/generate, só que sem persistir.
 */
export async function POST(request: Request) {
  const athleteId = await getAthleteId();
  if (!athleteId) {
    return NextResponse.json({ error: 'Conecte-se ao Strava primeiro.' }, { status: 401 });
  }

  const body = await request.json();
  const {
    raceDistanceKm,
    raceLabel,
    raceDate,
    durationWeeks: durationWeeksInput,
    level,
    daysPerWeek,
    currentWeeklyKm,
    includeStrength,
    coachContext,
  } = body as {
    raceDistanceKm: number;
    raceLabel: string;
    raceDate?: string;
    durationWeeks?: number;
    level: ExperienceLevel;
    daysPerWeek: number;
    currentWeeklyKm: number;
    includeStrength: boolean;
    coachContext?: string;
  };

  if (!raceDistanceKm || !raceLabel || !level || !daysPerWeek) {
    return NextResponse.json({ error: 'Dados incompletos para simular o plano.' }, { status: 400 });
  }

  const startDate = mondayOfCurrentWeek();

  let durationWeeks = durationWeeksInput ?? 9;
  if (raceDate) {
    const raceDateObj = new Date(`${raceDate}T00:00:00`);
    const daysUntilRace = Math.round((raceDateObj.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const weeksUntilRace = Math.floor(daysUntilRace / 7) + 1;
    durationWeeks = Math.min(26, Math.max(4, weeksUntilRace));
  }
  durationWeeks = Math.min(26, Math.max(4, durationWeeks));

  const generated = generatePlan({
    raceDistanceKm,
    raceLabel,
    level,
    daysPerWeek,
    durationWeeks,
    currentWeeklyKm: currentWeeklyKm || 0,
    startDate,
    includeStrength: includeStrength !== false,
    raceDate,
  });

  const coachNote = await reviewPlanWithAI(
    generated,
    { raceLabel, level, daysPerWeek, durationWeeks, currentWeeklyKm: currentWeeklyKm || 0 },
    coachContext
  );

  return NextResponse.json({
    weeks: generated.weeks,
    workouts: generated.workouts,
    assessment: generated.assessment,
    coachNote,
    startDate: startDate.toISOString().slice(0, 10),
  });
}
