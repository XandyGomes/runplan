import { NextResponse } from 'next/server';
import { getActivitiesWithRefresh } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const activities = await getActivitiesWithRefresh(30);
    const runs = activities
      .filter((a: any) => a.type === 'Run' || a.sport_type === 'Run')
      .map((a: any) => ({
        id: String(a.id),
        name: a.name,
        distanceKm: Math.round((a.distance / 1000) * 10) / 10,
        movingTimeMin: Math.round(a.moving_time / 60),
        startDate: a.start_date_local || a.start_date,
      }));
    return NextResponse.json({ activities: runs });
  } catch {
    return NextResponse.json({ activities: [] });
  }
}
