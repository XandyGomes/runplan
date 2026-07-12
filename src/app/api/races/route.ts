import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAthleteId } from '@/lib/session';

export const dynamic = 'force-dynamic';

// A tabela `races` é compartilhada com o Aura Run (mesma conta Supabase) e usa
// athlete_id numérico (o ID do atleta no Strava). Reaproveitamos ela aqui para
// que as corridas que o usuário já tinha cadastrado apareçam direto no RunPlan.
type RaceInput = {
  name?: string;
  date?: string;
  distance?: string;
  city?: string;
  goalTime?: string;
  notes?: string;
  kitDate?: string;
};

function rowToPayload(athleteId: number, body: RaceInput) {
  return {
    athlete_id: athleteId,
    name: body.name,
    date: body.date,
    distance: body.distance || null,
    city: body.city || null,
    goal_time: body.goalTime || null,
    notes: body.notes || null,
    kit_date: body.kitDate || null,
    status: 'upcoming',
  };
}

export async function GET() {
  const athleteId = await getAthleteId();
  if (!athleteId) {
    return NextResponse.json({ error: 'Conecte-se ao Strava primeiro.' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('races')
    .select('*')
    .eq('athlete_id', Number(athleteId))
    .order('date', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ races: data || [] });
}

export async function POST(request: Request) {
  const athleteId = await getAthleteId();
  if (!athleteId) {
    return NextResponse.json({ error: 'Conecte-se ao Strava primeiro.' }, { status: 401 });
  }

  const body = (await request.json()) as RaceInput;
  if (!body.name || !body.date) {
    return NextResponse.json({ error: 'Nome e data são obrigatórios.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('races')
    .insert(rowToPayload(Number(athleteId), body))
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ race: data });
}

export async function PATCH(request: Request) {
  const athleteId = await getAthleteId();
  if (!athleteId) {
    return NextResponse.json({ error: 'Conecte-se ao Strava primeiro.' }, { status: 401 });
  }

  const body = (await request.json()) as RaceInput & { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: 'ID da corrida ausente.' }, { status: 400 });
  }

  const payload = rowToPayload(Number(athleteId), body);
  const { data, error } = await supabase
    .from('races')
    .update(payload)
    .eq('id', body.id)
    .eq('athlete_id', Number(athleteId))
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ race: data });
}

export async function DELETE(request: Request) {
  const athleteId = await getAthleteId();
  if (!athleteId) {
    return NextResponse.json({ error: 'Conecte-se ao Strava primeiro.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'ID da corrida ausente.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('races')
    .delete()
    .eq('id', id)
    .eq('athlete_id', Number(athleteId));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
