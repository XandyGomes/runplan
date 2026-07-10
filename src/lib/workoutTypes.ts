export type WorkoutType =
  | 'easy'
  | 'tempo'
  | 'interval'
  | 'hills'
  | 'long'
  | 'race'
  | 'strength'
  | 'rest';

export const WORKOUT_TYPE_LABEL: Record<WorkoutType, string> = {
  easy: 'Corrida leve',
  tempo: 'Treino de ritmo',
  interval: 'Intervalos',
  hills: 'Subidas',
  long: 'Treino longo',
  race: 'Prova',
  strength: 'Força',
  rest: 'Descanso',
};

/** Cores em gradiente (from -> to) usadas na barra lateral do card e nos pontos do calendário. */
export const WORKOUT_TYPE_COLORS: Record<WorkoutType, { from: string; to: string }> = {
  easy: { from: 'var(--type-easy-from)', to: 'var(--type-easy-to)' },
  tempo: { from: 'var(--type-tempo-from)', to: 'var(--type-tempo-to)' },
  interval: { from: 'var(--type-interval-from)', to: 'var(--type-interval-to)' },
  hills: { from: 'var(--type-hills-from)', to: 'var(--type-hills-to)' },
  long: { from: 'var(--type-long-from)', to: 'var(--type-long-to)' },
  race: { from: 'var(--type-race-from)', to: 'var(--type-race-to)' },
  strength: { from: 'var(--type-strength-from)', to: 'var(--type-strength-to)' },
  rest: { from: 'var(--type-rest)', to: 'var(--type-rest)' },
};

export const isRunningType = (type: WorkoutType) =>
  type === 'easy' || type === 'tempo' || type === 'interval' || type === 'hills' || type === 'long' || type === 'race';
