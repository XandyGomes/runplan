import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';
import { supabase } from '@/lib/supabase';
import { getAthleteId, getActivitiesWithRefresh } from '@/lib/session';
import { todayISOInBrazil } from '@/lib/dates';

export const dynamic = 'force-dynamic';

function buildStravaContext(activities: any[]): string {
  const runs = activities.filter(a => a.type === 'Run' || a.sport_type === 'Run' || a.sport_type === 'TrailRun');
  if (runs.length === 0) return 'O atleta ainda não tem corridas registradas no Strava.';

  const totalKm = runs.reduce((s, a) => s + (a.distance || 0), 0) / 1000;
  const totalSec = runs.reduce((s, a) => s + (a.moving_time || 0), 0);
  const avgPace = totalKm > 0 ? totalSec / 60 / totalKm : 0;
  const longest = Math.max(...runs.map(a => a.distance || 0)) / 1000;

  let ctx = `🏃 HISTÓRICO DE CORRIDA (Strava):
• Corridas registradas: ${runs.length}
• Distância total: ${totalKm.toFixed(1)}km
• Ritmo médio geral: ${avgPace.toFixed(1)}min/km
• Corrida mais longa: ${longest.toFixed(2)}km\n\n`;

  const recent = runs.slice(0, 12).map(a => {
    const km = (a.distance / 1000).toFixed(2);
    const min = Math.floor(a.moving_time / 60);
    const pace = a.distance > 0 ? ((a.moving_time / 60) / (a.distance / 1000)).toFixed(1) : 'N/A';
    const date = new Date(a.start_date).toLocaleDateString('pt-BR');
    return `  • [${date}] ${a.name} — ${km}km em ${min}min (${pace}min/km)`;
  }).join('\n');

  ctx += `ÚLTIMAS CORRIDAS:\n${recent}`;
  return ctx;
}

async function buildPlanContext(athleteId: string): Promise<string> {
  const { data: plan } = await supabase
    .from('plans')
    .select('*')
    .eq('strava_athlete_id', athleteId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!plan) return 'O atleta ainda NÃO tem um plano de treino ativo no RunPlan.';

  const { data: workouts } = await supabase
    .from('workouts')
    .select('date,type,title,distance_km,completed_at,week_number')
    .eq('plan_id', plan.id)
    .order('date', { ascending: true });

  const all = workouts || [];
  const done = all.filter(w => w.completed_at).length;
  const runWorkouts = all.filter(w => w.distance_km);
  const totalKm = runWorkouts.reduce((s, w) => s + (w.distance_km || 0), 0);

  const today = todayISOInBrazil();
  const next = all.filter(w => w.date >= today && !w.completed_at).slice(0, 5);
  const nextLines = next
    .map(w => `  • ${w.date} — ${w.title}${w.distance_km ? ` (${w.distance_km}km)` : ''}`)
    .join('\n');

  return `📋 PLANO ATIVO NO RUNPLAN:
• Objetivo: ${plan.race_label} (${plan.race_distance_km}km)${plan.race_date ? `, prova em ${plan.race_date}` : ''}
• Nível: ${plan.level} · ${plan.days_per_week} dias/semana · ${plan.duration_weeks} semanas
• Progresso: ${done}/${all.length} treinos concluídos · ${totalKm.toFixed(0)}km planejados no total
PRÓXIMOS TREINOS:
${nextLines || '  (nenhum treino futuro pendente)'}`;
}

async function buildRacesContext(athleteId: string): Promise<string> {
  const { data: races } = await supabase
    .from('races')
    .select('name,date,distance,goal_time,kit_date')
    .eq('athlete_id', Number(athleteId))
    .order('date', { ascending: true });

  const today = todayISOInBrazil();
  const upcoming = (races || []).filter(r => r.date >= today);
  if (upcoming.length === 0) return '';

  const lines = upcoming
    .map(r => `  • ${r.name} — ${r.distance} em ${r.date}${r.goal_time ? ` (meta ${r.goal_time})` : ''}${r.kit_date ? ` · kit ${r.kit_date}` : ''}`)
    .join('\n');
  return `🏁 PRÓXIMAS CORRIDAS CADASTRADAS:\n${lines}`;
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    const athleteId = await getAthleteId();

    let stravaContext = 'O atleta não está conectado ao Strava.';
    let planContext = '';
    let racesContext = '';

    if (athleteId) {
      const [activities, plan, racesCtx] = await Promise.all([
        getActivitiesWithRefresh(100).catch(() => []),
        buildPlanContext(athleteId).catch(() => ''),
        buildRacesContext(athleteId).catch(() => ''),
      ]);
      stravaContext = buildStravaContext(activities);
      planContext = plan;
      racesContext = racesCtx;
    }

    const hoje = new Date().toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const systemMessage = {
      role: 'system' as const,
      content: `Você é a Aura, treinadora de corrida de elite com IA dentro do app RunPlan. Hoje é ${hoje}.

O RunPlan é um app de PLANEJAMENTO e acompanhamento de treinos — o atleta corre pelo Strava (já conectado), não pelo app. Seu papel é ser a treinadora: analisar o histórico, orientar sobre o plano de treino, ritmo, progressão, prevenção de lesões, nutrição e estratégia de prova.

${stravaContext}

${planContext}

${racesContext}

INSTRUÇÕES:
- Responda SEMPRE em português do Brasil, tom de treinadora experiente, motivadora e direta.
- Baseie-se nos dados reais acima (histórico do Strava, plano ativo, próximas provas). Cite números quando fizer sentido (ex: min/km, km).
- Se o atleta quiser um plano novo ou mudar o objetivo, oriente-o e diga que ele pode tocar em "Gerar novo plano" no Perfil (ou na tela de Corridas) — o RunPlan monta a periodização completa automaticamente e você revisa.
- Não sugira "correr pelo app": a corrida acontece no Strava.
- Seja concisa: 2 a 5 frases, a menos que o atleta peça detalhes.`,
    };

    const formatted = (messages || []).map((m: any) => ({
      role: (m.role === 'aura' ? 'assistant' : m.role) as 'user' | 'assistant',
      content: m.content,
    }));

    const reply = await callAI([systemMessage, ...formatted], 800);
    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('[Coach] Erro:', error?.message || error);
    return NextResponse.json({ reply: 'Ops, tive um problema técnico agora. Pode tentar de novo?' });
  }
}
