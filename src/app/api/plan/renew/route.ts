import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAthleteId } from '@/lib/session';
import { generatePlan, ExperienceLevel } from '@/lib/planEngine';
import { todayISOInBrazil } from '@/lib/dates';

export const dynamic = 'force-dynamic';

/**
 * "Renovar plano atual" — diferente de gerar um plano novo (que arquiva tudo e
 * começa do zero). Isso recalcula, com os MESMOS parâmetros do plano ativo, apenas
 * os treinos que ainda não foram feitos (a partir de hoje) — o histórico já
 * concluído (completed_at ou vinculado ao Strava) não é tocado.
 */
export async function POST() {
  const athleteId = await getAthleteId();
  if (!athleteId) {
    return NextResponse.json({ error: 'Conecte-se ao Strava primeiro.' }, { status: 401 });
  }

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
    currentWeeklyKm: plan.current_weekly_km || 0,
    startDate: new Date(`${plan.start_date}T00:00:00`),
    includeStrength: plan.include_strength,
    raceDate: plan.race_date || undefined,
  });

  const today = todayISOInBrazil();

  // Só apaga treinos futuros/pendentes de hoje em diante — o que já foi concluído
  // (marcado feito ou vinculado a uma corrida do Strava) fica intocado.
  const { error: deleteError } = await supabase
    .from('workouts')
    .delete()
    .eq('plan_id', plan.id)
    .gte('date', today)
    .is('completed_at', null);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const { data: existing } = await supabase.from('workouts').select('date').eq('plan_id', plan.id);
  const keptDates = new Set((existing || []).map(w => w.date));

  const rows = generated.workouts
    .filter(w => w.date >= today && !keptDates.has(w.date))
    .map(w => ({
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

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from('workouts').insert(rows);
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, renewed: rows.length });
}
