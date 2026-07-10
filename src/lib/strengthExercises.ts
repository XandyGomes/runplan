export type ExerciseIconKey =
  | 'squat'
  | 'lunge'
  | 'plank'
  | 'sidePlank'
  | 'bridge'
  | 'pushup'
  | 'calf'
  | 'core'
  | 'stretch'
  | 'mobility';

export type Exercise = {
  name: string;
  reps: string;
  cue: string;
  icon: ExerciseIconKey;
};

/**
 * Rotinas de força pra corredor — bodyweight, sem equipamento, focadas em prevenção de
 * lesão (glúteo, core, panturrilha, mobilidade de quadril). Chave = título exato gerado
 * pelo motor de plano (`STRENGTH_TITLES` em planEngine.ts).
 */
export const STRENGTH_ROUTINES: Record<string, Exercise[]> = {
  'Força: corpo inteiro': [
    { name: 'Agachamento', reps: '3x15', cue: 'Joelhos alinhados com os pés, desça até a coxa ficar paralela ao chão.', icon: 'squat' },
    { name: 'Flexão de braço', reps: '3x10', cue: 'Apoie os joelhos no chão se precisar. Corpo reto do ombro ao quadril.', icon: 'pushup' },
    { name: 'Afundo alternado', reps: '3x12 (cada perna)', cue: 'Passo longo à frente, joelho de trás quase toca o chão.', icon: 'lunge' },
    { name: 'Prancha', reps: '3x30s', cue: 'Corpo reto, abdômen contraído, sem deixar o quadril cair.', icon: 'plank' },
    { name: 'Elevação de panturrilha', reps: '3x20', cue: 'Suba na ponta dos pés bem devagar, desça controlado.', icon: 'calf' },
    { name: 'Superman', reps: '3x15', cue: 'Deitado de bruços, eleve braços e pernas ao mesmo tempo, segure 2s.', icon: 'core' },
  ],
  'Força: pernas e core': [
    { name: 'Agachamento búlgaro', reps: '3x10 (cada perna)', cue: 'Pé de trás apoiado num banco/degrau, desça reto.', icon: 'lunge' },
    { name: 'Ponte de glúteo', reps: '3x15', cue: 'Deitado, empurre o quadril pra cima contraindo o glúteo no topo.', icon: 'bridge' },
    { name: 'Prancha lateral', reps: '3x20s (cada lado)', cue: 'Corpo reto de lado, quadril elevado, sem torcer o tronco.', icon: 'sidePlank' },
    { name: 'Elevação de pernas', reps: '3x15', cue: 'Deitado de costas, suba as pernas retas sem tirar a lombar do chão.', icon: 'core' },
    { name: 'Afundo lateral', reps: '3x10 (cada perna)', cue: 'Passo largo pro lado, dobre o joelho que recebe o peso.', icon: 'lunge' },
    { name: 'Panturrilha unilateral', reps: '3x12 (cada perna)', cue: 'Uma perna de cada vez, apoio leve na parede pra equilíbrio.', icon: 'calf' },
  ],
  'Força: mobilidade': [
    { name: 'Alongamento de quadríceps', reps: '3x30s (cada perna)', cue: 'Em pé, puxe o pé em direção ao glúteo, joelhos juntos.', icon: 'stretch' },
    { name: 'Alongamento de isquiotibiais', reps: '3x30s (cada perna)', cue: 'Perna esticada à frente, incline o tronco mantendo as costas retas.', icon: 'stretch' },
    { name: 'Mobilidade de quadril (90-90)', reps: '2x8 (cada lado)', cue: 'Sentado, pernas em ângulo de 90°, alterne o giro do quadril entre os lados.', icon: 'mobility' },
    { name: 'Alongamento de panturrilha', reps: '3x30s (cada perna)', cue: 'Apoiado na parede, perna de trás esticada, calcanhar no chão.', icon: 'stretch' },
    { name: 'Rotação de tornozelo', reps: '2x10 (cada lado)', cue: 'Sentado ou em pé, gire o tornozelo bem devagar nos dois sentidos.', icon: 'mobility' },
    { name: 'Gato-vaca', reps: '2x10', cue: 'Quatro apoios, alterne arquear e curvar a coluna devagar com a respiração.', icon: 'mobility' },
  ],
};
