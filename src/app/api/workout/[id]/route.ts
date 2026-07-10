import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAthleteId } from '@/lib/session';
import { callAI } from '@/lib/ai';
import { WORKOUT_TYPE_LABEL, WorkoutType } from '@/lib/workoutTypes';

export const dynamic = 'force-dynamic';

async function generateSummary(workout: any): Promise<string> {
  const prompt = `Você é um treinador de corrida experiente e motivador (estilo Runna). Escreva um resumo curto (3 a 5 frases, em português do Brasil) para o treino de hoje do atleta, explicando o objetivo do treino e como executá-lo bem. Não invente números diferentes dos fornecidos.

Tipo de treino: ${WORKOUT_TYPE_LABEL[workout.type as WorkoutType]}
Título: ${workout.title}
Distância: ${workout.distance_km ? `${workout.distance_km}km` : 'não se aplica'}
Duração estimada: ${workout.duration_min_low}-${workout.duration_min_high} minutos
Orientação de ritmo: ${workout.pace_guidance || 'não especificada'}`;

  return callAI([{ role: 'user', content: prompt }], 300);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const athleteId = await getAthleteId();
  if (!athleteId) {
    return NextResponse.json({ error: 'Conecte-se ao Strava primeiro.' }, { status: 401 });
  }

  const { id } = await params;
  const { data: workout, error } = await supabase.from('workouts').select('*').eq('id', id).single();

  if (error || !workout) {
    return NextResponse.json({ error: 'Treino não encontrado.' }, { status: 404 });
  }

  if (!workout.ai_summary) {
    try {
      const summary = await generateSummary(workout);
      await supabase.from('workouts').update({ ai_summary: summary }).eq('id', id);
      workout.ai_summary = summary;
    } catch (err: any) {
      console.warn('[Workout] Falha ao gerar resumo de IA:', err.message);
    }
  }

  return NextResponse.json({ workout });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const athleteId = await getAthleteId();
  if (!athleteId) {
    return NextResponse.json({ error: 'Conecte-se ao Strava primeiro.' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action, activityId } = body as { action: string; activityId?: string };

  if (action === 'skip') {
    await supabase.from('workouts').update({ skipped: true }).eq('id', id);
    return NextResponse.json({ ok: true });
  }

  if (action === 'unskip') {
    await supabase.from('workouts').update({ skipped: false }).eq('id', id);
    return NextResponse.json({ ok: true });
  }

  if (action === 'complete') {
    await supabase.from('workouts').update({ completed_at: new Date().toISOString() }).eq('id', id);
    return NextResponse.json({ ok: true });
  }

  if (action === 'uncomplete') {
    await supabase.from('workouts').update({ completed_at: null, linked_strava_activity_id: null }).eq('id', id);
    return NextResponse.json({ ok: true });
  }

  if (action === 'link_activity') {
    if (!activityId) {
      return NextResponse.json({ error: 'activityId é obrigatório.' }, { status: 400 });
    }
    await supabase
      .from('workouts')
      .update({ completed_at: new Date().toISOString(), linked_strava_activity_id: activityId })
      .eq('id', id);
    return NextResponse.json({ ok: true });
  }

  if (action === 'refresh_summary') {
    const { data: workout } = await supabase.from('workouts').select('*').eq('id', id).single();
    if (!workout) {
      return NextResponse.json({ error: 'Treino não encontrado.' }, { status: 404 });
    }
    try {
      const summary = await generateSummary(workout);
      await supabase.from('workouts').update({ ai_summary: summary }).eq('id', id);
      return NextResponse.json({ ai_summary: summary });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Ação desconhecida.' }, { status: 400 });
}
