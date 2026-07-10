import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { refreshAccessToken } from '@/lib/strava';

export const dynamic = 'force-dynamic';

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('strava_refresh_token')?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: 'Sem refresh token' }, { status: 401 });
  }

  try {
    const data = await refreshAccessToken(refreshToken);

    cookieStore.set('strava_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: data.expires_in,
      path: '/',
      sameSite: 'lax',
    });
    cookieStore.set('strava_refresh_token', data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
