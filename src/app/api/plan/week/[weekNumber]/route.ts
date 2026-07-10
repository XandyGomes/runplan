import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAthleteId } from '@/lib/session';
import { generatePlan, ExperienceLevel } from '@/lib/planEngine';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ weekNumber: string }> }) {
  const athleteId = await getAthleteId();
  if (!athleteId) {
    return NextResponse.json({ error: 'Conecte-se ao Strava primeiro.' }, { status: 401 });
  }

  const { weekNumber: weekNumberStr } = await params;
  const weekNumber = Number(weekNumberStr);

  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('*')
    .eq('strava_athlete_id', athleteId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (planError || !plan) {
    return NextResponse.json({ error: planError?.message || 'Nenhum plano ativo encontrado.' }, { status: 404 });
  }

  const generated = generatePlan({
    raceDistanceKm: plan.race_distance_km,
    raceLabel: plan.race_label,
    level: plan.level as ExperienceLevel,
    daysPerWeek: plan.days_per_week,
    durationWeeks: plan.duration_weeks,
    currentWeeklyKm: 0,
    startDate: new Date(`${plan.start_date}T00:00:00`),
    includeStrength: plan.include_strength,
  });

  const weekWorkouts = generated.workouts.filter(w => w.weekNumber === weekNumber);
  if (weekWorkouts.length === 0) {
    return NextResponse.json({ error: 'Semana inválida para este plano.' }, { status: 400 });
  }

  const { error: deleteError } = await supabase
    .from('workouts')
    .delete()
    .eq('plan_id', plan.id)
    .eq('week_number', weekNumber);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const rows = weekWorkouts.map(w => ({
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

  const { error: insertError } = await supabase.from('workouts').insert(rows);
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
