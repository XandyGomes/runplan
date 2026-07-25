'use client';

import { useEffect, useState } from 'react';
import styles from './NotificationPrompt.module.css';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function subscribeDevice() {
  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  const publicKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim();
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
  await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription }),
  });
}

export default function NotificationPrompt() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const supportsPush = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
    const ios = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

    Promise.resolve().then(() => {
      setSupported(supportsPush);
      setIsIos(ios);
      setIsStandalone(standalone);
      if (supportsPush) setPermission(Notification.permission);
    });

    // Se a permissão já foi concedida antes, garante que o dispositivo continua inscrito
    // (ex.: depois de limpar dados do navegador ou trocar de sessão).
    if (supportsPush && Notification.permission === 'granted') {
      subscribeDevice().catch(() => {});
    }
  }, []);

  const requestPermission = async () => {
    setRequesting(true);
    setError('');
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm === 'granted') {
        await subscribeDevice();
      }
    } catch {
      setError('Não foi possível ativar as notificações agora.');
    } finally {
      setRequesting(false);
    }
  };

  if (!supported && !isIos) return null;

  if (isIos && !isStandalone) {
    return (
      <div className={styles.banner}>
        <span className={styles.icon}>📲</span>
        <div>
          <b>Instale o app pra receber alertas</b>
          <p>No iPhone, notificações de prova e retirada de kit só funcionam com o RunPlan adicionado à Tela de Início.</p>
        </div>
      </div>
    );
  }

  if (permission === 'granted') return null;

  if (permission === 'denied') {
    return (
      <div className={`${styles.banner} ${styles.bannerWarn}`}>
        <span className={styles.icon}>⚠️</span>
        <div>
          <b>Notificações bloqueadas</b>
          <p>Ative nas configurações do navegador pra receber avisos de prova e retirada de kit.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.banner}>
      <span className={styles.icon}>🔔</span>
      <div className={styles.body}>
        <b>Ativar lembretes de prova e kit</b>
        <p>Receba um aviso no celular no dia da corrida e na retirada do kit.</p>
        {error && <p className={styles.error}>{error}</p>}
        <button className={`${styles.btn} pressable`} onClick={requestPermission} disabled={requesting}>
          {requesting ? 'Ativando...' : 'Permitir notificações'}
        </button>
      </div>
    </div>
  );
}
