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
  const [renewing, setRenewing] = useState(false);
  const [renewMessage, setRenewMessage] = useState('');

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

  const renewPlan = async () => {
    if (!confirm('Isso recalcula os treinos que você ainda não fez, mantendo o mesmo objetivo. O que já foi concluído não é apagado. Continuar?')) return;
    setRenewing(true);
    setRenewMessage('');
    try {
      const res = await fetch('/api/plan/renew', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setRenewMessage(data.error || 'Erro ao renovar o plano.');
      } else {
        setRenewMessage(`Plano renovado — ${data.renewed} treino(s) futuro(s) recalculado(s).`);
      }
    } catch {
      setRenewMessage('Erro de conexão ao renovar o plano.');
    } finally {
      setRenewing(false);
    }
  };

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
          <p style={{ marginBottom: 12 }}>
            {plan.race_label} · {plan.duration_weeks} semanas · nível {plan.level}
          </p>
          <button className="btn-secondary" style={{ width: '100%' }} onClick={renewPlan} disabled={renewing}>
            {renewing ? 'Renovando...' : '↻ Renovar plano atual'}
          </button>
          <p style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>
            Recalcula só os treinos que faltam, com o mesmo objetivo — não apaga o que você já concluiu.
          </p>
          {renewMessage && (
            <p style={{ fontSize: 12, marginTop: 8, marginBottom: 0, color: 'var(--primary)' }}>{renewMessage}</p>
          )}
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

      <button className="btn-primary" style={{ width: '100%', marginBottom: 4 }} onClick={() => router.push('/onboarding')}>
        Gerar novo plano
      </button>
      <p style={{ fontSize: 12, marginBottom: 12 }}>Substitui totalmente o plano atual — use se mudou de objetivo de prova.</p>

      <button className="btn-secondary" style={{ width: '100%', marginBottom: 12 }} onClick={() => router.push('/simular')}>
        Simular outro plano (sem substituir)
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
