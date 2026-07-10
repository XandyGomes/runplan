import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAthleteId, getActivitiesWithRefresh } from '@/lib/session';

export const dynamic = 'force-dynamic';

const DAY_MS = 24 * 60 * 60 * 1000;

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

  const runs = activities.filter(a => a.type === 'Run' || a.sport_type === 'Run');

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
    const workoutTime = new Date(`${workout.date}T00:00:00`).getTime();
    const candidate = runs.find(a => {
      const activityTime = new Date(a.start_date_local || a.start_date).getTime();
      return Math.abs(activityTime - workoutTime) <= DAY_MS;
    });

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
