import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAthleteId } from '@/lib/session';
import { WorkoutType, WORKOUT_TYPE_LABEL } from '@/lib/workoutTypes';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const athleteId = await getAthleteId();
  if (!athleteId) {
    return NextResponse.json({ error: 'Conecte-se ao Strava primeiro.' }, { status: 401 });
  }

  const { date, type, distanceKm } = (await request.json()) as {
    date: string;
    type: WorkoutType;
    distanceKm: number;
  };

  const { data: plan } = await supabase
    .from('plans')
    .select('id, start_date')
    .eq('strava_athlete_id', athleteId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!plan) {
    return NextResponse.json({ error: 'Nenhum plano ativo encontrado.' }, { status: 404 });
  }

  const daysDiff = Math.round(
    (new Date(`${date}T00:00:00`).getTime() - new Date(`${plan.start_date}T00:00:00`).getTime()) / (24 * 60 * 60 * 1000)
  );
  const weekNumber = Math.max(1, Math.floor(daysDiff / 7) + 1);

  const { data: workout, error } = await supabase
    .from('workouts')
    .insert({
      plan_id: plan.id,
      week_number: weekNumber,
      date,
      type,
      title: `${WORKOUT_TYPE_LABEL[type]}${distanceKm ? `: ${distanceKm}km` : ''}`,
      distance_km: distanceKm || null,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ workout });
}
