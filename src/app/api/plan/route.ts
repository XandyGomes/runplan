import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAthleteId } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
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

  if (planError) {
    return NextResponse.json({ error: planError.message }, { status: 500 });
  }

  if (!plan) {
    return NextResponse.json({ plan: null, workouts: [] });
  }

  const { data: workouts, error: workoutsError } = await supabase
    .from('workouts')
    .select('*')
    .eq('plan_id', plan.id)
    .order('date', { ascending: true });

  if (workoutsError) {
    return NextResponse.json({ error: workoutsError.message }, { status: 500 });
  }

  return NextResponse.json({ plan, workouts: workouts || [] });
}
