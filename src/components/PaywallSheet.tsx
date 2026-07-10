'use client';

import { useState } from 'react';
import styles from './PaywallSheet.module.css';

export default function PaywallSheet({ onClose, onUnlocked }: { onClose: () => void; onUnlocked: () => void }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const subscribe = async () => {
    setLoading(true);
    const res = await fetch('/api/subscription/checkout', { method: 'POST' });
    const data = await res.json();
    setLoading(false);
    setMessage(data.message || 'Checkout ainda não disponível.');
  };

  const unlockWithCode = async () => {
    setLoading(true);
    setCodeError('');
    const res = await fetch('/api/subscription', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionStatus: 'premium', code }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setCodeError(data.error || 'Não foi possível desbloquear.');
      return;
    }
    onUnlocked();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.badge}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0B0E14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l2.9 6.6L22 9.3l-5 4.9 1.2 7.1L12 17.8l-6.2 3.5L7 14.2 2 9.3l7.1-.7z" />
          </svg>
        </div>
        <h2 className={styles.title}>Assinar o RunPlan Premium</h2>
        <p className={styles.subtitle}>
          Desbloqueie todas as semanas do seu plano, treino de força completo e ajustes ilimitados.
        </p>
        {message && <p className={styles.subtitle}>{message}</p>}

        <p className={styles.codeLabel}>Tem um código de desbloqueio?</p>
        <div className={styles.codeRow}>
          <input
            type="password"
            placeholder="Código secreto"
            value={code}
            onChange={e => setCode(e.target.value)}
          />
          <button className="btn-primary" disabled={loading || !code} onClick={unlockWithCode}>
            Desbloquear
          </button>
        </div>
        {codeError && <p className={styles.codeError}>{codeError}</p>}

        <div className={styles.actions}>
          <button className="btn-secondary" disabled={loading} onClick={subscribe}>
            Assinar agora
          </button>
          <button className={styles.testBtn} disabled={loading} onClick={onClose}>
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}
