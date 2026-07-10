import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAthleteId } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const athleteId = await getAthleteId();
  if (!athleteId) {
    return NextResponse.json({ error: 'Conecte-se ao Strava primeiro.' }, { status: 401 });
  }
  const { data } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('strava_athlete_id', athleteId)
    .maybeSingle();
  return NextResponse.json({ subscriptionStatus: data?.subscription_status || 'free' });
}

/** Alterna o status localmente sem cobrança real — útil enquanto o Stripe não está configurado. */
export async function PATCH(request: Request) {
  const athleteId = await getAthleteId();
  if (!athleteId) {
    return NextResponse.json({ error: 'Conecte-se ao Strava primeiro.' }, { status: 401 });
  }
  const { subscriptionStatus, code } = await request.json();
  if (subscriptionStatus !== 'free' && subscriptionStatus !== 'premium') {
    return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });
  }

  // Desbloquear premium sem cobrança real exige o código secreto — evita que qualquer
  // visitante da URL pública se dê acesso premium sozinho.
  if (subscriptionStatus === 'premium') {
    const unlockCode = process.env.PREMIUM_UNLOCK_CODE;
    if (!unlockCode) {
      return NextResponse.json({ error: 'Desbloqueio por código não configurado.' }, { status: 500 });
    }
    if (code !== unlockCode) {
      return NextResponse.json({ error: 'Código incorreto.' }, { status: 403 });
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ subscription_status: subscriptionStatus })
    .eq('strava_athlete_id', athleteId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
