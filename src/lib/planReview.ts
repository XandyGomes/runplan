import { callAI } from './ai';
import { GeneratedPlan } from './planEngine';

/** Segunda-feira da semana atual (não a próxima) — garante que hoje sempre caia dentro da semana 1. */
export function mondayOfCurrentWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Dom .. 6=Sáb
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

/**
 * Manda o plano JÁ CALCULADO (determinístico) pra IA revisar como um treinador
 * revisaria um rascunho — a IA nunca inventa números novos, só analisa os que
 * o motor de periodização já validou como seguros e escreve uma devolutiva real.
 */
export async function reviewPlanWithAI(
  generated: GeneratedPlan,
  input: { raceLabel: string; level: string; daysPerWeek: number; durationWeeks: number; currentWeeklyKm: number },
  coachContext?: string
): Promise<string | null> {
  const phaseSummary = generated.weeks
    .map(w => `Semana ${w.weekNumber} (${w.phase}): ${w.totalKm}km`)
    .join('\n');

  const prompt = `Você é um treinador de corrida especialista revisando um plano que já foi calculado por um sistema de periodização (regra de crescimento de ~8%/semana, descarga a cada 4 semanas, taper no final). Os números abaixo JÁ são seguros e definitivos — não invente nem sugira números diferentes, sua função é dar uma devolutiva de treinador sobre esse plano específico.

Objetivo: ${input.raceLabel}
Nível informado: ${input.level}
Dias de corrida por semana: ${input.daysPerWeek}
Duração do plano: ${input.durationWeeks} semanas
Volume semanal atual do atleta: ${input.currentWeeklyKm}km

Progressão semanal calculada:
${phaseSummary}

Avaliação automática do sistema: pico de ${generated.assessment.peakWeeklyKm}km/semana, treino longo de até ${generated.assessment.peakLongRunKm}km (ideal seria ${generated.assessment.idealPeakWeeklyKm}km/semana). Considerado ${generated.assessment.realistic ? 'adequado' : 'abaixo do ideal para a distância, mas seguro'}.
${coachContext ? `\nO atleta contou o seguinte contexto: "${coachContext}"` : ''}

Escreva uma devolutiva curta (3 a 5 frases, português do Brasil, tom de treinador experiente e direto) comentando esse plano específico. ${coachContext ? 'Responda diretamente ao contexto que o atleta contou, com orientação prática.' : ''} Se o plano estiver abaixo do ideal, explique como abordar a prova com segurança (ex: ritmo mais conservador, pausas para caminhada). Não repita os números de forma robótica — fale como um treinador de verdade falaria com o atleta.`;

  try {
    const text = await callAI([{ role: 'user', content: prompt }], 350);
    return text.trim();
  } catch (err: any) {
    console.warn('[Plan] Falha ao gerar revisão da IA:', err.message);
    return null;
  }
}
