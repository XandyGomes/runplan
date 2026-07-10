import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  for (const name of ['strava_token', 'strava_refresh_token', 'user_name', 'user_photo', 'strava_athlete_id']) {
    cookieStore.delete(name);
  }
  return NextResponse.redirect(new URL('/', request.url));
}
