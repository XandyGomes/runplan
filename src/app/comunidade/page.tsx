import BottomNav from '@/components/BottomNav';

const TIPS = [
  {
    title: 'Aqueça antes de correr',
    body: '5 a 10 minutos de mobilidade e ativação reduzem o risco de lesão em treinos intensos.',
  },
  {
    title: 'Respeite os treinos leves',
    body: 'Corredores que respeitam o ritmo leve nos dias fáceis costumam evoluir mais rápido e sofrem menos lesões.',
  },
  {
    title: 'Hidratação é treino também',
    body: 'Comece a se hidratar bem antes da prova, não só no dia. Seu desempenho agradece.',
  },
];

export default function ComunidadePage() {
  return (
    <div style={{ padding: '16px 20px 120px', minHeight: '100dvh' }}>
      <h1 style={{ marginBottom: 8 }}>Comunidade</h1>
      <p style={{ marginBottom: 24 }}>
        Em breve: feed de atividades e conquistas de outros corredores do RunPlan. Por enquanto, aqui vão algumas dicas.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {TIPS.map(tip => (
          <div key={tip.title} className="glass-card">
            <h3 style={{ marginBottom: 6 }}>{tip.title}</h3>
            <p>{tip.body}</p>
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
