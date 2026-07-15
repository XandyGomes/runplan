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
  /** Passo a passo completo — mostrado na folha de detalhe ao tocar no exercício. */
  howTo: string;
  icon: ExerciseIconKey;
};

/**
 * Rotinas de força pra corredor — bodyweight, sem equipamento, focadas em prevenção de
 * lesão (glúteo, core, panturrilha, mobilidade de quadril). Chave = título exato gerado
 * pelo motor de plano (`STRENGTH_TITLES` em planEngine.ts).
 */
export const STRENGTH_ROUTINES: Record<string, Exercise[]> = {
  'Força: corpo inteiro': [
    {
      name: 'Agachamento',
      reps: '3x15',
      cue: 'Joelhos alinhados com os pés, desça até a coxa ficar paralela ao chão.',
      howTo:
        'Fique em pé com os pés na largura dos ombros, pontas levemente viradas para fora. Desça como se fosse sentar numa cadeira, mantendo o peito erguido e o peso nos calcanhares. Os joelhos devem seguir a direção dos pés, sem "cair" para dentro. Desça até a coxa ficar paralela ao chão (ou o quanto sua mobilidade permitir) e suba controladamente, contraindo o glúteo no topo. Erro comum: deixar o joelho ultrapassar muito a ponta do pé ou arredondar as costas.',
      icon: 'squat',
    },
    {
      name: 'Flexão de braço',
      reps: '3x10',
      cue: 'Apoie os joelhos no chão se precisar. Corpo reto do ombro ao quadril.',
      howTo:
        'Apoie as mãos no chão, um pouco mais largas que os ombros. Mantenha o corpo reto, do ombro ao calcanhar (ou ao joelho, na versão facilitada), com o abdômen contraído. Desça o peito em direção ao chão dobrando os cotovelos a cerca de 45° do corpo, e empurre de volta até estender os braços. Se for difícil, apoie os joelhos no chão em vez dos pés — o importante é manter a linha reta do corpo. Erro comum: deixar o quadril subir ou cair, formando um "V" ou uma "banana".',
      icon: 'pushup',
    },
    {
      name: 'Afundo alternado',
      reps: '3x12 (cada perna)',
      cue: 'Passo longo à frente, joelho de trás quase toca o chão.',
      howTo:
        'Em pé, dê um passo longo à frente com uma perna. Dobre os dois joelhos até o de trás quase tocar o chão, formando dois ângulos de 90°. O joelho da frente não deve ultrapassar muito a ponta do pé. Empurre pelo calcanhar da frente para voltar à posição inicial e repita alternando as pernas. Erro comum: dar um passo curto demais, o que sobrecarrega o joelho da frente.',
      icon: 'lunge',
    },
    {
      name: 'Prancha',
      reps: '3x30s',
      cue: 'Corpo reto, abdômen contraído, sem deixar o quadril cair.',
      howTo:
        'Apoie os antebraços no chão, cotovelos alinhados abaixo dos ombros. Estenda as pernas para trás, apoiado nas pontas dos pés, formando uma linha reta da cabeça aos calcanhares. Contraia o abdômen e o glúteo para não deixar o quadril cair nem subir demais. Respire normalmente durante o tempo. Erro comum: deixar a lombar "afundar" — se sentir dor nas costas, contraia mais o abdômen ou reduza o tempo.',
      icon: 'plank',
    },
    {
      name: 'Elevação de panturrilha',
      reps: '3x20',
      cue: 'Suba na ponta dos pés bem devagar, desça controlado.',
      howTo:
        'Em pé, apoiado numa parede se precisar de equilíbrio, suba na ponta dos pés o mais alto possível, contraindo a panturrilha no topo. Desça devagar e controlado até o calcanhar quase tocar o chão novamente. Pode ser feito com os dois pés ou, para mais desafio, um pé de cada vez. Erro comum: fazer o movimento rápido demais, perdendo o controle da descida.',
      icon: 'calf',
    },
    {
      name: 'Superman',
      reps: '3x15',
      cue: 'Deitado de bruços, eleve braços e pernas ao mesmo tempo, segure 2s.',
      howTo:
        'Deite de bruços no chão, braços estendidos à frente da cabeça. Eleve simultaneamente braços, peito e pernas do chão, como se estivesse "voando", contraindo a lombar e o glúteo. Segure por 2 segundos no topo e desça controlado. Erro comum: elevar rápido demais usando embalo em vez de controle muscular.',
      icon: 'core',
    },
  ],
  'Força: pernas e core': [
    {
      name: 'Agachamento búlgaro',
      reps: '3x10 (cada perna)',
      cue: 'Pé de trás apoiado num banco/degrau, desça reto.',
      howTo:
        'Fique de costas para um banco ou degrau e apoie o peito do pé de trás nele. A perna da frente fica à frente do corpo, um pouco afastada. Desça dobrando o joelho da frente até formar cerca de 90°, mantendo o tronco ereto. Suba empurrando pelo calcanhar da frente. Erro comum: inclinar o tronco muito para frente, tirando o trabalho do glúteo.',
      icon: 'lunge',
    },
    {
      name: 'Ponte de glúteo',
      reps: '3x15',
      cue: 'Deitado, empurre o quadril pra cima contraindo o glúteo no topo.',
      howTo:
        'Deite de costas, joelhos dobrados, pés apoiados no chão na largura do quadril. Empurre o quadril para cima contraindo o glúteo, até o corpo formar uma linha reta dos ombros aos joelhos. Segure um instante no topo e desça controlado. Erro comum: usar a lombar em vez do glúteo para subir — foque em "apertar" o glúteo no topo do movimento.',
      icon: 'bridge',
    },
    {
      name: 'Prancha lateral',
      reps: '3x20s (cada lado)',
      cue: 'Corpo reto de lado, quadril elevado, sem torcer o tronco.',
      howTo:
        'Deite de lado, apoie o antebraço no chão com o cotovelo alinhado abaixo do ombro. Eleve o quadril do chão, formando uma linha reta da cabeça aos pés. Pode apoiar o pé de cima à frente do de baixo para mais estabilidade. Mantenha o quadril alto durante todo o tempo, sem deixar o tronco torcer para frente ou para trás.',
      icon: 'sidePlank',
    },
    {
      name: 'Elevação de pernas',
      reps: '3x15',
      cue: 'Deitado de costas, suba as pernas retas sem tirar a lombar do chão.',
      howTo:
        'Deite de costas, pernas estendidas, mãos ao lado do corpo ou embaixo do quadril para apoio. Suba as pernas retas até formarem cerca de 90° com o chão, sem tirar a lombar do chão. Desça controlado, sem deixar os pés baterem no chão entre as repetições, se conseguir. Erro comum: usar embalo ou deixar a lombar arquear — se sentir dor lombar, dobre levemente os joelhos.',
      icon: 'core',
    },
    {
      name: 'Afundo lateral',
      reps: '3x10 (cada perna)',
      cue: 'Passo largo pro lado, dobre o joelho que recebe o peso.',
      howTo:
        'Em pé, dê um passo largo para o lado. Dobre o joelho da perna que recebeu o peso, empurrando o quadril para trás como um agachamento de lado, mantendo a outra perna esticada. Empurre de volta ao centro pelo calcanhar da perna dobrada. Erro comum: deixar o joelho da perna dobrada cair para dentro.',
      icon: 'lunge',
    },
    {
      name: 'Panturrilha unilateral',
      reps: '3x12 (cada perna)',
      cue: 'Uma perna de cada vez, apoio leve na parede pra equilíbrio.',
      howTo:
        'Em pé sobre uma perna só, com apoio leve na parede para equilíbrio, suba na ponta do pé o mais alto possível e desça controlado. Repita todas as repetições de um lado antes de trocar. Erro comum: se apoiar demais na parede, tirando o esforço da panturrilha.',
      icon: 'calf',
    },
  ],
  'Força: mobilidade': [
    {
      name: 'Alongamento de quadríceps',
      reps: '3x30s (cada perna)',
      cue: 'Em pé, puxe o pé em direção ao glúteo, joelhos juntos.',
      howTo:
        'Fique em pé, apoie-se em uma parede se precisar de equilíbrio. Dobre o joelho e puxe o pé em direção ao glúteo, segurando pelo tornozelo. Mantenha os joelhos juntos e o quadril "para frente" — não deixe o quadril se jogar para trás. Segure 30s, respirando normalmente, e troque de perna.',
      icon: 'stretch',
    },
    {
      name: 'Alongamento de isquiotibiais',
      reps: '3x30s (cada perna)',
      cue: 'Perna esticada à frente, incline o tronco mantendo as costas retas.',
      howTo:
        'Estenda uma perna à frente (calcanhar no chão, ponta do pé para cima), a outra fica levemente flexionada atrás. Incline o tronco para frente a partir do quadril, mantendo as costas retas — não arredonde a coluna. Sinta o alongamento atrás da coxa. Segure 30s e troque a perna.',
      icon: 'stretch',
    },
    {
      name: 'Mobilidade de quadril (90-90)',
      reps: '2x8 (cada lado)',
      cue: 'Sentado, pernas em ângulo de 90°, alterne o giro do quadril entre os lados.',
      howTo:
        'Sentado no chão, uma perna à frente dobrada a 90° e a outra atrás também a 90°, formando um "Z" com as pernas. Gire o tronco/quadril para alternar as pernas de posição de um lado para o outro, sem usar muito as mãos para se ajudar. É um giro controlado do quadril, não um movimento brusco.',
      icon: 'mobility',
    },
    {
      name: 'Alongamento de panturrilha',
      reps: '3x30s (cada perna)',
      cue: 'Apoiado na parede, perna de trás esticada, calcanhar no chão.',
      howTo:
        'Apoie as mãos na parede, uma perna à frente com joelho dobrado e a perna de trás esticada com o calcanhar sempre no chão. Empurre o quadril para frente, sentindo o alongamento na panturrilha da perna de trás. Segure 30s e troque.',
      icon: 'stretch',
    },
    {
      name: 'Rotação de tornozelo',
      reps: '2x10 (cada lado)',
      cue: 'Sentado ou em pé, gire o tornozelo bem devagar nos dois sentidos.',
      howTo:
        'Sentado ou em pé (apoiado se precisar), levante um pé do chão e gire o tornozelo bem devagar, fazendo círculos completos — 10 voltas em um sentido, depois inverta o sentido. Simples e sem impacto, ideal pra soltar a articulação antes ou depois de correr.',
      icon: 'mobility',
    },
    {
      name: 'Gato-vaca',
      reps: '2x10',
      cue: 'Quatro apoios, alterne arquear e curvar a coluna devagar com a respiração.',
      howTo:
        'Apoie-se em quatro apoios (mãos e joelhos no chão). Inspire arqueando as costas para baixo, olhando para cima (posição "vaca"). Expire arredondando a coluna para cima, queixo em direção ao peito (posição "gato"). Alterne devagar, sincronizando o movimento com a respiração.',
      icon: 'mobility',
    },
  ],
};
