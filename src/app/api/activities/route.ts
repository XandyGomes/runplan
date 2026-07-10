import { NextResponse } from 'next/server';
import { getActivitiesWithRefresh } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const activities = await getActivitiesWithRefresh(60);
    const mapped = activities.map((a: any) => ({
      id: String(a.id),
      name: a.name,
      type: a.type || a.sport_type,
      distanceKm: Math.round((a.distance / 1000) * 100) / 100,
      movingTimeMin: Math.round(a.moving_time / 60),
      elevationGain: Math.round(a.total_elevation_gain || 0),
      startDate: a.start_date_local || a.start_date,
    }));
    return NextResponse.json({ activities: mapped });
  } catch (err: any) {
    if (err.message === 'NOT_AUTHENTICATED') {
      return NextResponse.json({ error: 'Conecte-se ao Strava primeiro.' }, { status: 401 });
    }
    return NextResponse.json({ activities: [] });
  }
}
