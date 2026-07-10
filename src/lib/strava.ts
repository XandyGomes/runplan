const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;

if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
  console.warn('Strava credentials not configured');
}

export const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
};

export const getStravaAuthUrl = () => {
  if (!STRAVA_CLIENT_ID) {
    throw new Error('STRAVA_CLIENT_ID is not configured');
  }
  const redirectUri = `${getBaseUrl()}/api/auth/strava/callback`;
  return `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=activity:read_all,read`;
};

export const exchangeToken = async (code: string) => {
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: Number(STRAVA_CLIENT_ID),
      client_secret: STRAVA_CLIENT_SECRET?.trim(),
      code,
      grant_type: 'authorization_code',
    }),
  });
  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status}`);
  }
  return response.json();
};

export const getActivities = async (accessToken: string, perPage: number = 100, after?: number) => {
  const params = new URLSearchParams({ per_page: String(perPage) });
  if (after) params.set('after', String(after));
  const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch activities: ${response.status}`);
  }
  return response.json();
};

export const refreshAccessToken = async (refreshToken: string) => {
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: Number(STRAVA_CLIENT_ID),
      client_secret: STRAVA_CLIENT_SECRET?.trim(),
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`);
  }
  return response.json();
};
