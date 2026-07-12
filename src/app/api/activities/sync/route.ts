import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAthleteId, getActivitiesWithRefresh } from '@/lib/session';

export const dynamic = 'force-dynamic';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Data local (yyyy-mm-dd) de uma atividade do Strava, sem depender de fuso do servidor. */
function activityLocalDate(activity: any): string {
  const raw = activity.start_date_local || activity.start_date;
  return String(raw).slice(0, 10);
}

/**
 * Uma atividade só é candidata a um treino se caiu no MESMO dia (não ±1 dia — isso já
 * causou vínculo errado de corridas de dias diferentes) e, quando o treino tem distância
 * planejada, se a distância real está numa faixa plausível pra aquele treino (evita linkar
 * uma corrida curta não relacionada a um treino longo do mesmo dia).
 */
function isPlausibleMatch(workout: any, activity: any): boolean {
  if (activityLocalDate(activity) !== workout.date) return false;

  if (workout.distance_km) {
    const activityKm = activity.distance / 1000;
    const tolerance = Math.max(workout.distance_km * 0.4, 2); // 40% ou 2km, o que for maior
    if (Math.abs(activityKm - workout.distance_km) > tolerance) return false;
  }

  return true;
}

export async function POST() {
  const athleteId = await getAthleteId();
  if (!athleteId) {
    return NextResponse.json({ error: 'Conecte-se ao Strava primeiro.' }, { status: 401 });
  }

  const { data: plan } = await supabase
    .from('plans')
    .select('id')
    .eq('strava_athlete_id', athleteId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!plan) {
    return NextResponse.json({ matched: 0 });
  }

  const after = Math.floor((Date.now() - 45 * DAY_MS) / 1000);
  let activities: any[] = [];
  try {
    activities = await getActivitiesWithRefresh(100, after);
  } catch {
    return NextResponse.json({ matched: 0, error: 'Não foi possível buscar atividades do Strava.' });
  }

  // Atividades já vinculadas a QUALQUER treino deste plano não podem ser reaproveitadas
  // num vínculo automático futuro — sem isso, a mesma corrida podia acabar linkada em
  // mais de um treino em execuções separadas do sync.
  const { data: alreadyLinked } = await supabase
    .from('workouts')
    .select('linked_strava_activity_id')
    .eq('plan_id', plan.id)
    .not('linked_strava_activity_id', 'is', null);
  const linkedIds = new Set((alreadyLinked || []).map(w => w.linked_strava_activity_id));

  const runs = activities.filter(a => (a.type === 'Run' || a.sport_type === 'Run') && !linkedIds.has(String(a.id)));

  const { data: openWorkouts } = await supabase
    .from('workouts')
    .select('*')
    .eq('plan_id', plan.id)
    .is('completed_at', null)
    .is('linked_strava_activity_id', null)
    .neq('type', 'rest')
    .neq('type', 'strength');

  let matched = 0;
  for (const workout of openWorkouts || []) {
    const candidate = runs.find(a => isPlausibleMatch(workout, a));

    if (candidate) {
      await supabase
        .from('workouts')
        .update({
          completed_at: candidate.start_date,
          linked_strava_activity_id: String(candidate.id),
        })
        .eq('id', workout.id);
      runs.splice(runs.indexOf(candidate), 1);
      matched++;
    }
  }

  return NextResponse.json({ matched });
}
