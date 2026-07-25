import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAthleteId } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const athleteId = await getAthleteId();
  if (!athleteId) {
    return NextResponse.json({ error: 'Conecte-se ao Strava primeiro.' }, { status: 401 });
  }

  const { subscription } = await request.json();
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: 'Inscrição de push inválida.' }, { status: 400 });
  }

  const numericAthleteId = Number(athleteId);

  const { data: existing } = await supabase
    .from('runplan_push_subscriptions')
    .select('id')
    .eq('athlete_id', numericAthleteId)
    .filter('subscription->>endpoint', 'eq', subscription.endpoint)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('runplan_push_subscriptions')
      .update({ subscription })
      .eq('id', existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from('runplan_push_subscriptions')
      .insert({ athlete_id: numericAthleteId, subscription });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
