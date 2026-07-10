import BottomNav from '@/components/BottomNav';

const FAQ = [
  {
    q: 'Como o plano de treino é gerado?',
    a: 'Com base no seu objetivo de prova, nível, dias disponíveis e volume atual, geramos um plano periodizado (base, construção, pico e polimento) e ajustamos automaticamente conforme você completa os treinos.',
  },
  {
    q: 'Como marco um treino como concluído?',
    a: 'Toque no checkbox do card do treino, ou vincule manualmente uma atividade do Strava pelo menu "•••" na tela do treino.',
  },
  {
    q: 'Posso mudar meu objetivo de prova?',
    a: 'Sim, na tela de Perfil você pode gerar um novo plano a qualquer momento.',
  },
  {
    q: 'O que acontece se eu perder um treino?',
    a: 'Sem problema — o plano continua, e você pode redefinir uma semana inteira no Calendário se quiser recomeçá-la.',
  },
];

export default function SuportePage() {
  return (
    <div style={{ padding: '16px 20px 120px', minHeight: '100dvh' }}>
      <h1 style={{ marginBottom: 20 }}>Suporte</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        {FAQ.map(item => (
          <div key={item.q} className="glass-card">
            <h3 style={{ marginBottom: 6 }}>{item.q}</h3>
            <p>{item.a}</p>
          </div>
        ))}
      </div>
      <a href="mailto:suporte@runplan.app" className="btn-secondary" style={{ width: '100%' }}>
        Falar com o suporte
      </a>
      <BottomNav />
    </div>
  );
}
