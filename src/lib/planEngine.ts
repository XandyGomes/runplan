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

export type GeneratedPlan = {
  weeks: GeneratedWeek[];
  workouts: GeneratedWorkout[];
};

const PACE_MIN_PER_KM: Record<ExperienceLevel, [number, number]> = {
  iniciante: [7.0, 7.6],
  intermediario: [5.8, 6.4],
  avancado: [4.8, 5.3],
};

// Volume semanal "de pico" sugerido conforme a distância da prova e o nível.
const peakWeeklyKmFor = (raceDistanceKm: number, level: ExperienceLevel) => {
  const base = raceDistanceKm <= 5 ? 25 : raceDistanceKm <= 10 ? 35 : raceDistanceKm <= 21.5 ? 50 : 70;
  const levelFactor = level === 'iniciante' ? 0.75 : level === 'intermediario' ? 1 : 1.25;
  return Math.round(base * levelFactor);
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

function buildWorkoutForSlot(
  slotIndex: number,
  slotsInWeek: number[],
  phase: GeneratedWeek['phase'],
  isRaceWeek: boolean,
  input: PlanInput,
  weekKm: number
): { type: WorkoutType; distanceKm: number; title: string; paceGuidance: string } {
  const isLast = slotIndex === slotsInWeek.length - 1;
  const longKm = roundHalf(weekKm * 0.35);

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

  const remaining = Math.max(weekKm - longKm, slotsInWeek.length * 3);
  const otherSlots = slotsInWeek.length - 1;
  const evenShare = roundHalf(remaining / Math.max(1, otherSlots));

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
  const peakKm = peakWeeklyKmFor(input.raceDistanceKm, input.level);
  const startKm = Math.max(input.currentWeeklyKm > 0 ? input.currentWeeklyKm : peakKm * 0.4, days * 3);

  const weeks: GeneratedWeek[] = [];
  const workouts: GeneratedWorkout[] = [];

  for (let weekNumber = 1; weekNumber <= input.durationWeeks; weekNumber++) {
    const phase = phaseForWeek(weekNumber, input.durationWeeks);
    const isRaceWeek = weekNumber === input.durationWeeks;
    const progress = Math.min(1, (weekNumber - 1) / Math.max(1, input.durationWeeks - 2));
    let weekKm = startKm + (peakKm - startKm) * progress;

    if (phase === 'taper') {
      const taperWeeks = Math.max(1, Math.round(input.durationWeeks * 0.1));
      const weeksFromEnd = input.durationWeeks - weekNumber;
      weekKm = peakKm * (weeksFromEnd === 0 ? 0.4 : 1 - (taperWeeks - weeksFromEnd) * 0.2);
    } else if (isDeloadWeek(weekNumber)) {
      weekKm *= 0.75;
    }

    weekKm = roundHalf(Math.max(weekKm, days * 3));

    const weekStart = addDays(input.startDate, (weekNumber - 1) * 7);
    const weekEnd = addDays(weekStart, 6);

    let totalKm = 0;

    runningSlots.forEach((dayOffset, slotIndex) => {
      const built = buildWorkoutForSlot(slotIndex, runningSlots, phase, isRaceWeek, input, weekKm);
      const date = toISODate(addDays(weekStart, dayOffset));
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

  return { weeks, workouts };
}
