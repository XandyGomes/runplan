import { NextResponse } from 'next/server';
import { getAthleteId, getActivityDetailWithRefresh } from '@/lib/session';
import { decodePolyline } from '@/lib/polyline';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const athleteId = await getAthleteId();
  if (!athleteId) {
    return NextResponse.json({ error: 'Conecte-se ao Strava primeiro.' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const activity = await getActivityDetailWithRefresh(id);
    const polyline = activity.map?.polyline || activity.map?.summary_polyline || '';

    return NextResponse.json({
      id: String(activity.id),
      name: activity.name,
      distanceKm: Math.round((activity.distance / 1000) * 100) / 100,
      movingTimeMin: Math.round(activity.moving_time / 60),
      elevationGain: Math.round(activity.total_elevation_gain || 0),
      avgHeartrate: activity.average_heartrate ? Math.round(activity.average_heartrate) : null,
      calories: activity.calories ? Math.round(activity.calories) : null,
      startDate: activity.start_date_local || activity.start_date,
      route: polyline ? decodePolyline(polyline) : [],
    });
  } catch (err: any) {
    const message = err.message === 'NOT_AUTHENTICATED'
      ? 'Sua conexão com o Strava expirou. Reconecte em Perfil e tente de novo.'
      : 'Não foi possível buscar a atividade no Strava agora.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
