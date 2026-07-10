'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import PaywallSheet from '@/components/PaywallSheet';
import { getClientCookie } from '@/lib/cookies';
import { Plan } from '@/lib/types';

export default function PerfilPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userPhoto, setUserPhoto] = useState('');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'free' | 'premium'>('free');
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    fetch('/api/plan')
      .then(res => (res.status === 401 ? null : res.json()))
      .then(data => {
        setUserName(getClientCookie('user_name'));
        setUserPhoto(getClientCookie('user_photo'));
        if (data?.plan) setPlan(data.plan);
      });

    fetch('/api/subscription')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data) setSubscriptionStatus(data.subscriptionStatus);
      });
  }, []);

  const downgradeToFree = async () => {
    await fetch('/api/subscription', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionStatus: 'free' }),
    });
    setSubscriptionStatus('free');
  };

  return (
    <div style={{ padding: '16px 20px 120px', minHeight: '100dvh' }}>
      <h1 style={{ marginBottom: 20 }}>Perfil</h1>

      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        {userPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={userPhoto} alt={userName} style={{ width: 56, height: 56, borderRadius: '100%' }} />
        ) : (
          <div style={{ width: 56, height: 56, borderRadius: '100%', background: 'var(--bg-card-hover)' }} />
        )}
        <div>
          <h3>{userName || 'Atleta'}</h3>
          <span className="badge badge-success" style={{ marginTop: 4 }}>
            ✓ Conectado ao Strava
          </span>
        </div>
      </div>

      {plan && (
        <div className="glass-card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 8 }}>Objetivo atual</h3>
          <p>
            {plan.race_label} · {plan.duration_weeks} semanas · nível {plan.level}
          </p>
        </div>
      )}

      <div className="glass-card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 8 }}>Assinatura</h3>
        <p style={{ marginBottom: 12 }}>
          Status atual: <b style={{ color: 'var(--text)' }}>{subscriptionStatus === 'premium' ? 'Premium' : 'Gratuito'}</b>
        </p>
        <button
          className="btn-secondary"
          style={{ width: '100%' }}
          onClick={() => (subscriptionStatus === 'premium' ? downgradeToFree() : setShowPaywall(true))}
        >
          {subscriptionStatus === 'premium' ? 'Voltar para o plano gratuito' : 'Ativar Premium'}
        </button>
      </div>

      {showPaywall && (
        <PaywallSheet
          onClose={() => setShowPaywall(false)}
          onUnlocked={() => {
            setShowPaywall(false);
            setSubscriptionStatus('premium');
          }}
        />
      )}

      <button className="btn-primary" style={{ width: '100%', marginBottom: 12 }} onClick={() => router.push('/onboarding')}>
        Gerar novo plano
      </button>

      <form action="/api/auth/logout" method="POST">
        <button className="btn-secondary" style={{ width: '100%' }} type="submit">
          Desconectar do Strava
        </button>
      </form>

      <BottomNav />
    </div>
  );
}
