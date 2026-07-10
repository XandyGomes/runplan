import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeToken } from '@/lib/strava';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');

  if (errorParam) {
    return new NextResponse(`Erro do Strava: ${errorParam}`, { status: 400 });
  }

  if (!code) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    const data = await exchangeToken(code);

    if (data.errors || !data.access_token) {
      return new NextResponse(`Erro na troca de token: ${JSON.stringify(data)}`, { status: 400 });
    }

    const cookieStore = await cookies();
    cookieStore.set('strava_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: data.expires_in,
      path: '/',
      sameSite: 'strict',
    });

    cookieStore.set('strava_refresh_token', data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      sameSite: 'strict',
    });

    cookieStore.set('user_name', data.athlete.firstname || '', {
      path: '/',
      sameSite: 'strict',
    });
    cookieStore.set('user_photo', data.athlete.profile_medium || data.athlete.profile || '', {
      path: '/',
      sameSite: 'strict',
    });
    cookieStore.set('strava_athlete_id', data.athlete.id.toString(), {
      path: '/',
      sameSite: 'strict',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
    });

    // Garante que existe um profile no Supabase para este atleta
    await supabase.from('profiles').upsert(
      {
        strava_athlete_id: data.athlete.id.toString(),
        name: data.athlete.firstname || null,
        avatar_url: data.athlete.profile_medium || data.athlete.profile || null,
      },
      { onConflict: 'strava_athlete_id', ignoreDuplicates: false }
    );

    return NextResponse.redirect(new URL('/', request.url));
  } catch (error: any) {
    console.error('[Strava Callback] Erro:', error);
    return new NextResponse(`Erro Interno: ${error.message}`, { status: 500 });
  }
}
