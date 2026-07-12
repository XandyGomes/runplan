import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAthleteId } from '@/lib/session';
import { generatePlan, ExperienceLevel } from '@/lib/planEngine';
import { mondayOfCurrentWeek, reviewPlanWithAI } from '@/lib/planReview';

export const dynamic = 'force-dynamic';

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
    return NextResponse.json({ error: 'Dados incompletos para gerar o plano.' }, { status: 400 });
  }

  const startDate = mondayOfCurrentWeek(new Date());

  let durationWeeks = durationWeeksInput ?? 9;
  if (raceDate) {
    const raceDateObj = new Date(`${raceDate}T00:00:00`);
    const daysUntilRace = Math.round((raceDateObj.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    // Semana em que a data da prova cai dentro da grade segunda-domingo que começa em startDate.
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

  // Arquiva plano ativo anterior, se existir.
  await supabase.from('plans').update({ status: 'archived' }).eq('strava_athlete_id', athleteId).eq('status', 'active');

  const planRow = {
    strava_athlete_id: athleteId,
    race_distance_km: raceDistanceKm,
    race_label: raceLabel,
    race_date: raceDate || null,
    start_date: startDate.toISOString().slice(0, 10),
    level,
    days_per_week: daysPerWeek,
    duration_weeks: durationWeeks,
    include_strength: includeStrength !== false,
    // Guardado pra "Redefinir semana" conseguir recalcular a MESMA progressão depois —
    // sem isso o reset caía sempre pra uma curva partindo de 0km/semana.
    current_weekly_km: currentWeeklyKm || 0,
    status: 'active',
  };

  let { data: plan, error: planError } = await supabase.from('plans').insert(planRow).select().single();

  // Fallback só até a migração (supabase/schema.sql) que adiciona a coluna
  // current_weekly_km ser aplicada no banco em produção.
  if (planError?.message?.includes('current_weekly_km')) {
    const { current_weekly_km, ...legacyRow } = planRow;
    void current_weekly_km;
    ({ data: plan, error: planError } = await supabase.from('plans').insert(legacyRow).select().single());
  }

  if (planError || !plan) {
    return NextResponse.json({ error: planError?.message || 'Erro ao criar o plano.' }, { status: 500 });
  }

  const workoutRows = generated.workouts.map(w => ({
    plan_id: plan.id,
    week_number: w.weekNumber,
    date: w.date,
    type: w.type,
    title: w.title,
    distance_km: w.distanceKm,
    duration_min_low: w.durationMinLow,
    duration_min_high: w.durationMinHigh,
    pace_guidance: w.paceGuidance,
  }));

  const { error: workoutsError } = await supabase.from('workouts').insert(workoutRows);
  if (workoutsError) {
    return NextResponse.json({ error: workoutsError.message }, { status: 500 });
  }

  const coachNote = await reviewPlanWithAI(
    generated,
    { raceLabel, level, daysPerWeek, durationWeeks, currentWeeklyKm: currentWeeklyKm || 0 },
    coachContext
  );

  return NextResponse.json({ planId: plan.id, weeks: generated.weeks, assessment: generated.assessment, coachNote });
}
