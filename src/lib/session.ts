import { cookies } from 'next/headers';
import { getActivities, refreshAccessToken } from './strava';

export async function getAthleteId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('strava_athlete_id')?.value || null;
}

async function persistTokens(data: { access_token: string; refresh_token: string; expires_in: number }) {
  const cookieStore = await cookies();
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
}

/** Busca atividades do Strava, renovando o access_token automaticamente se necessário. */
export async function getActivitiesWithRefresh(perPage = 100, after?: number) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('strava_refresh_token')?.value;
  const existingToken = cookieStore.get('strava_token')?.value;

  let token: string;
  if (existingToken) {
    token = existingToken;
  } else {
    if (!refreshToken) throw new Error('NOT_AUTHENTICATED');
    const data = await refreshAccessToken(refreshToken);
    await persistTokens(data);
    token = data.access_token;
  }

  try {
    return await getActivities(token, perPage, after);
  } catch (err) {
    if (!refreshToken) throw err;
    const data = await refreshAccessToken(refreshToken);
    await persistTokens(data);
    return getActivities(data.access_token, perPage, after);
  }
}
