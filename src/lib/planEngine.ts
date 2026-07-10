import { WorkoutType } from './workoutTypes';

export type ExperienceLevel = 'iniciante' | 'intermediario' | 'avancado';

export type PlanInput = {
  raceDistanceKm: number;
  raceLabel: string;
  level: ExperienceLevel;
  daysPerWeek: number; // dias de corrida por semana (3-6), força é sempre adicional
  durationWeeks: number; // 6-26
  currentWeeklyKm: number;
  startDate: Date; // segunda-feira da semana 1
  includeStrength: boolean;
  /** Data exata da prova (ISO yyyy-mm-dd). Se informada, o treino de prova usa essa data
   *  em vez do domingo calculado da última semana — garante que bate com o que o atleta digitou. */
  raceDate?: string;
};

export type GeneratedWorkout = {
  weekNumber: number;
  date: string; // ISO yyyy-mm-dd
  type: WorkoutType;
  title: string;
  distanceKm: number | null;
  durationMinLow: number | null;
  durationMinHigh: number | null;
  paceGuidance: string | null;
};

export type GeneratedWeek = {
  weekNumber: number;
  startDate: string;
  endDate: string;
  totalKm: number;
  phase: 'base' | 'build' | 'peak' | 'taper';
};

export type PlanAssessment = {
  peakWeeklyKm: number;
  peakLongRunKm: number;
  idealPeakWeeklyKm: number;
  realistic: boolean;
  note: string;
};

export type GeneratedPlan = {
  weeks: GeneratedWeek[];
  workouts: GeneratedWorkout[];
  assessment: PlanAssessment;
};

const PACE_MIN_PER_KM: Record<ExperienceLevel, [number, number]> = {
  iniciante: [7.0, 7.6],
  intermediario: [5.8, 6.4],
  avancado: [4.8, 5.3],
};

// Volume semanal "de pico" sugerido conforme a distância da prova e o nível — usado como
// referência ideal (pro comparativo na avaliação), não trava mais o treino longo.
const peakWeeklyKmFor = (raceDistanceKm: number, level: ExperienceLevel) => {
  const base = raceDistanceKm <= 5 ? 25 : raceDistanceKm <= 10 ? 35 : raceDistanceKm <= 21.5 ? 50 : 70;
  const levelFactor = level === 'iniciante' ? 0.75 : level === 'intermediario' ? 1 : 1.25;
  return Math.round(base * levelFactor);
};

/**
 * Teto seguro pro treino longo, como % da distância da prova — o que treinadores de
 * verdade usam pra priorizar o longão em prazos curtos (é ele que define se o atleta
 * aguenta a distância, não o volume total da semana). Corridas curtas podem chegar bem
 * perto da distância da prova; maratona nunca passa de ~32-34km em treino.
 */
const longRunCapFor = (raceDistanceKm: number) => {
  if (raceDistanceKm <= 10) return raceDistanceKm;
  if (raceDistanceKm <= 21.5) return raceDistanceKm * 0.85;
  return Math.min(raceDistanceKm * 0.75, 32);
};

const phaseForWeek = (weekNumber: number, totalWeeks: number): GeneratedWeek['phase'] => {
  const taperWeeks = Math.max(1, Math.round(totalWeeks * 0.1));
  const peakStart = totalWeeks - taperWeeks - Math.max(1, Math.round(totalWeeks * 0.15));
  const buildStart = Math.round(totalWeeks * 0.4);

  if (weekNumber > totalWeeks - taperWeeks) return 'taper';
  if (weekNumber > peakStart) return 'peak';
  if (weekNumber > buildStart) return 'build';
  return 'base';
};

const isDeloadWeek = (weekNumber: number) => weekNumber % 4 === 0;

/** Crescimento máximo dos dias "de apoio" (não-longão) — versão conservadora da "regra
 *  dos 10%" pra reduzir risco de lesão por overtraining nesses treinos. */
const MAX_WEEKLY_GROWTH = 1.08;
/** Crescimento do treino longo em km/semana — o longão pode (e deve) crescer mais rápido
 *  que o resto, porque uma corrida longa por semana carrega bem menos risco de lesão por
 *  overtraining do que somar intensidade em vários dias, e é o fator que mais importa pra
 *  completar a distância da prova. */
const LONG_RUN_GROWTH_KM = 2;
const DELOAD_FACTOR = 0.75;

/** Long run mínimo (% da distância da prova) pra considerar o plano seguro/realista. */
const MIN_LONG_RUN_RATIO_FOR_DISTANCE = (raceDistanceKm: number) => {
  if (raceDistanceKm <= 10) return 0.9;
  if (raceDistanceKm <= 21.5) return 0.75;
  return 0.65;
};

const round5 = (mins: number) => Math.max(15, Math.round(mins / 5) * 5);
const roundHalf = (km: number) => Math.max(2, Math.round(km * 2) / 2);

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

/** Ordem dos dias da semana usada nos templates: 0=Seg ... 6=Dom */
const RUNNING_DAY_TEMPLATES: Record<number, number[]> = {
  3: [1, 3, 6], // Ter, Qui, Dom
  4: [1, 3, 5, 6], // Ter, Qui, Sáb, Dom
  5: [1, 2, 3, 5, 6], // Ter, Qua, Qui, Sáb, Dom
  6: [1, 2, 3, 4, 5, 6], // Ter a Dom (exceto Seg)
};

const STRENGTH_DAY_SLOTS = [0, 2]; // Seg, Qua
const STRENGTH_TITLES = ['Força: corpo inteiro', 'Força: pernas e core', 'Força: mobilidade'];

function paceLabel(level: ExperienceLevel, hard: boolean) {
  const [low, high] = PACE_MIN_PER_KM[level];
  const pace = hard ? low - 0.6 : high;
  const min = Math.floor(pace);
  const sec = Math.round((pace - min) * 60);
  return `${min}:${sec.toString().padStart(2, '0')}/km`;
}

/**
 * Progressão genérica semana a semana, respeitando um teto (cap) e aplicando descarga a
 * cada 4ª semana sem travar a tendência de crescimento (a tendência interna continua
 * subindo mesmo em semana de descarga — ela só reduz o volume PRESCRITO daquela semana).
 * O polimento (taper) reduz a partir do pico realmente alcançado, nunca do teto ideal.
 */
function computeProgression(
  startKm: number,
  capKm: number,
  durationWeeks: number,
  growth: { additive?: number; multiplicative?: number },
  minKm: number
): number[] {
  const taperWeeks = Math.max(1, Math.round(durationWeeks * 0.1));
  const buildWeeks = durationWeeks - taperWeeks;

  const volumes: number[] = [];
  let trendKm = startKm;
  for (let weekNumber = 1; weekNumber <= buildWeeks; weekNumber++) {
    if (weekNumber > 1) {
      const next = growth.additive ? trendKm + growth.additive : trendKm * (growth.multiplicative ?? 1);
      trendKm = Math.min(next, capKm);
    }
    const actual = isDeloadWeek(weekNumber) ? trendKm * DELOAD_FACTOR : trendKm;
    volumes.push(roundHalf(Math.max(actual, minKm)));
  }

  const achievedPeakKm = volumes.length > 0 ? Math.max(...volumes) : startKm;
  for (let i = 0; i < taperWeeks; i++) {
    const weeksFromEnd = taperWeeks - i - 1;
    const factor = weeksFromEnd === 0 ? 0.4 : 1 - (taperWeeks - weeksFromEnd) * 0.2;
    volumes.push(roundHalf(Math.max(achievedPeakKm * factor, minKm)));
  }

  return volumes;
}

function buildAssessment(peakWeeklyKm: number, peakLongRunKm: number, idealPeakKm: number, input: PlanInput): PlanAssessment {
  const minRatio = MIN_LONG_RUN_RATIO_FOR_DISTANCE(input.raceDistanceKm);
  const realistic = peakLongRunKm / input.raceDistanceKm >= minRatio;

  const note = realistic
    ? `Seu plano chega a um pico de ${peakWeeklyKm}km na semana, com treino longo de até ${peakLongRunKm}km — volume adequado para completar ${input.raceLabel} com segurança.`
    : `O prazo até a prova é curto: o plano prioriza o treino longo (chega a ${peakLongRunKm}km) e mantém os outros dias mais conservadores para você chegar preparado com segurança. Isso ainda é um pouco menos do que o ideal para ${input.raceLabel} — no dia, use um ritmo mais tranquilo desde o início (inclusive com caminhada nos trechos finais, se precisar). Se puder, considere mais tempo de preparação da próxima vez.`;

  return { peakWeeklyKm, peakLongRunKm, idealPeakWeeklyKm: idealPeakKm, realistic, note };
}

function buildWorkoutForSlot(
  slotIndex: number,
  slotsInWeek: number[],
  phase: GeneratedWeek['phase'],
  isRaceWeek: boolean,
  input: PlanInput,
  longKm: number,
  otherKm: number
): { type: WorkoutType; distanceKm: number; title: string; paceGuidance: string } {
  const isLast = slotIndex === slotsInWeek.length - 1;

  if (isRaceWeek && isLast) {
    return {
      type: 'race',
      distanceKm: input.raceDistanceKm,
      title: `Prova: ${input.raceLabel}`,
      paceGuidance: 'Dia da prova! Confie no treino, controle a ansiedade no início e guarde energia para o final.',
    };
  }

  if (isLast) {
    return {
      type: 'long',
      distanceKm: longKm,
      title: `${longKm}km longo`,
      paceGuidance: `Ritmo constante e controlado, ${paceLabel(input.level, false)}. Foco em resistência, não em velocidade.`,
    };
  }

  const otherSlots = slotsInWeek.length - 1;
  const evenShare = roundHalf(otherKm / Math.max(1, otherSlots));

  if (phase === 'base') {
    return {
      type: 'easy',
      distanceKm: evenShare,
      title: `${evenShare}km leve`,
      paceGuidance: `Não mais rápido do que ${paceLabel(input.level, false)}. Ritmo de conversa, sem testar velocidade.`,
    };
  }

  // Em build/peak, intercala intervalado/subidas/tempo com leve.
  const hardTypeCycle: WorkoutType[] = phase === 'peak' ? ['interval', 'hills', 'tempo'] : ['interval', 'tempo'];
  const isHardSlot = slotIndex % 2 === 1 && !isLast;

  if (isHardSlot) {
    const type = hardTypeCycle[Math.floor(slotIndex / 2) % hardTypeCycle.length];
    const dist = Math.min(evenShare, 8);
    if (type === 'interval') {
      return {
        type,
        distanceKm: dist,
        title: `Intervalos: ${dist}km`,
        paceGuidance: `Séries curtas e intensas (${paceLabel(input.level, true)}) com recuperação em trote leve entre elas.`,
      };
    }
    if (type === 'hills') {
      return {
        type,
        distanceKm: dist,
        title: `Subidas: ${dist}km`,
        paceGuidance: 'Suba em esforço forte e controlado, desça recuperando em trote leve.',
      };
    }
    return {
      type: 'tempo',
      distanceKm: dist,
      title: `${dist}km ritmo`,
      paceGuidance: `Ritmo confortavelmente forte e sustentado, ${paceLabel(input.level, true)}.`,
    };
  }

  return {
    type: 'easy',
    distanceKm: evenShare,
    title: `${evenShare}km leve`,
    paceGuidance: `Não mais rápido do que ${paceLabel(input.level, false)}. Ritmo de conversa, sem testar velocidade.`,
  };
}

export function generatePlan(input: PlanInput): GeneratedPlan {
  const days = Math.min(6, Math.max(3, input.daysPerWeek));
  const runningSlots = RUNNING_DAY_TEMPLATES[days];
  const idealPeakKm = peakWeeklyKmFor(input.raceDistanceKm, input.level);
  const longRunCapKm = longRunCapFor(input.raceDistanceKm);

  // Ponto de partida: assume que a corrida mais longa da rotina atual gira em torno de
  // 35% do volume semanal informado — o resto (`otherStartKm`) é o que sobra pros outros dias.
  const currentWeeklyKm = input.currentWeeklyKm > 0 ? input.currentWeeklyKm : idealPeakKm * 0.4;
  const longStartKm = Math.max(Math.min(currentWeeklyKm * 0.35, longRunCapKm), 3);
  const otherStartKm = Math.max(currentWeeklyKm - longStartKm, (days - 1) * 3);
  const otherCapKm = Math.max(idealPeakKm - longRunCapKm, otherStartKm);

  const longVolumes = computeProgression(longStartKm, longRunCapKm, input.durationWeeks, { additive: LONG_RUN_GROWTH_KM }, 3);
  const otherVolumes = computeProgression(otherStartKm, otherCapKm, input.durationWeeks, { multiplicative: MAX_WEEKLY_GROWTH }, (days - 1) * 3);

  const peakLongRunKm = Math.max(...longVolumes);
  const peakWeeklyKm = Math.max(...longVolumes.map((v, i) => v + otherVolumes[i]));
  const assessment = buildAssessment(peakWeeklyKm, peakLongRunKm, idealPeakKm, input);

  const weeks: GeneratedWeek[] = [];
  const workouts: GeneratedWorkout[] = [];

  for (let weekNumber = 1; weekNumber <= input.durationWeeks; weekNumber++) {
    const phase = phaseForWeek(weekNumber, input.durationWeeks);
    const isRaceWeek = weekNumber === input.durationWeeks;
    const longKm = longVolumes[weekNumber - 1];
    const otherKm = otherVolumes[weekNumber - 1];

    const weekStart = addDays(input.startDate, (weekNumber - 1) * 7);
    const weekEnd = addDays(weekStart, 6);

    let totalKm = 0;

    runningSlots.forEach((dayOffset, slotIndex) => {
      const built = buildWorkoutForSlot(slotIndex, runningSlots, phase, isRaceWeek, input, longKm, otherKm);
      const isRaceDay = isRaceWeek && slotIndex === runningSlots.length - 1;
      const date = isRaceDay && input.raceDate ? input.raceDate : toISODate(addDays(weekStart, dayOffset));
      const [low, high] = PACE_MIN_PER_KM[input.level];
      const paceForDuration = built.type === 'long' || built.type === 'easy' ? high : (low + high) / 2;

      totalKm += built.distanceKm;

      workouts.push({
        weekNumber,
        date,
        type: built.type,
        title: built.title,
        distanceKm: built.distanceKm,
        durationMinLow: round5(built.distanceKm * low),
        durationMinHigh: round5(built.distanceKm * paceForDuration + 5),
        paceGuidance: built.paceGuidance,
      });
    });

    if (input.includeStrength && phase !== 'taper') {
      STRENGTH_DAY_SLOTS.forEach((dayOffset, i) => {
        const date = toISODate(addDays(weekStart, dayOffset));
        workouts.push({
          weekNumber,
          date,
          type: 'strength',
          title: STRENGTH_TITLES[(weekNumber + i) % STRENGTH_TITLES.length],
          distanceKm: null,
          durationMinLow: 25,
          durationMinHigh: 35,
          paceGuidance: 'Priorize técnica sobre carga. Descanse 48h entre sessões de força.',
        });
      });
    }

    weeks.push({
      weekNumber,
      startDate: toISODate(weekStart),
      endDate: toISODate(weekEnd),
      totalKm: Math.round(totalKm * 10) / 10,
      phase,
    });
  }

  return { weeks, workouts, assessment };
}
