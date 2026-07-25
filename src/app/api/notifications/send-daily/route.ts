import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { supabase } from '@/lib/supabase';
import { todayISOInBrazil } from '@/lib/dates';

export const dynamic = 'force-dynamic';

const vapidPublicKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim();
const vapidPrivateKey = (process.env.VAPID_PRIVATE_KEY || '').trim();
const vapidSubject = (process.env.VAPID_SUBJECT || 'mailto:contato@runplan.app').trim();

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

async function sendToAthlete(athleteId: number, title: string, body: string) {
  const { data: subs, error } = await supabase
    .from('runplan_push_subscriptions')
    .select('*')
    .eq('athlete_id', athleteId);

  if (error) {
    console.error('[Notifications] Erro ao buscar inscrições:', error.message);
    throw new Error(error.message);
  }

  let sent = 0;
  for (const sub of subs || []) {
    try {
      await webpush.sendNotification(sub.subscription, JSON.stringify({ title, body, url: '/corridas' }));
      sent++;
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabase.from('runplan_push_subscriptions').delete().eq('id', sub.id);
      }
    }
  }
  return sent;
}

/**
 * Checagem diária (cron da Vercel, ver vercel.json) — avisa o atleta no dia da prova
 * e no dia de retirada do kit. Autenticação: a Vercel manda `Authorization: Bearer
 * $CRON_SECRET` automaticamente em execuções de cron; ?secret= é só pra teste manual.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get('authorization');
  const secretParam = searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && secretParam !== cronSecret) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ error: 'Chaves VAPID não configuradas.' }, { status: 500 });
  }

  const testAthleteId = searchParams.get('test_athlete_id');
  if (testAthleteId) {
    const type = searchParams.get('type') || 'kit';
    const title = type === 'kit' ? '🎁 Retirada de Kit (teste)!' : '🏁 Dia de prova (teste)!';
    const body =
      type === 'kit'
        ? 'Alerta de teste: hoje seria o dia de retirar o kit.'
        : 'Alerta de teste: hoje seria o dia da prova. Boa sorte!';
    try {
      const sent = await sendToAthlete(Number(testAthleteId), title, body);
      if (sent === 0) {
        return NextResponse.json(
          { error: 'Nenhum dispositivo inscrito para este atleta. Ative as notificações em Corridas primeiro.' },
          { status: 400 }
        );
      }
      return NextResponse.json({ ok: true, sent });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  const today = todayISOInBrazil();

  const { data: races, error } = await supabase
    .from('races')
    .select('*')
    .eq('status', 'upcoming')
    .or(`date.eq.${today},kit_date.eq.${today}`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!races || races.length === 0) {
    return NextResponse.json({ ok: true, message: `Nenhum alerta para hoje (${today}).` });
  }

  let notificationsSent = 0;
  for (const race of races) {
    const isRaceDay = race.date === today;
    const title = isRaceDay ? '🏁 Dia de prova! Boa sorte!' : '🎁 Retirada de kit!';
    const body = isRaceDay
      ? `Hoje é o dia da sua corrida: ${race.name}. Dê o seu melhor! 🏃‍♂️`
      : `Hoje é o dia de retirar o kit da prova ${race.name}. Não esqueça seus documentos!`;
    try {
      notificationsSent += await sendToAthlete(race.athlete_id, title, body);
    } catch (err: any) {
      console.error(`[Notifications] Falha ao notificar athlete_id ${race.athlete_id}:`, err.message);
    }
  }

  return NextResponse.json({ ok: true, date: today, racesChecked: races.length, notificationsSent });
}
