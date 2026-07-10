'use client';

import { useEffect, useState } from 'react';
import styles from './InstallPrompt.module.css';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'runplan_install_dismissed';

export default function InstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    const alreadyDismissed = !!sessionStorage.getItem(DISMISS_KEY);

    Promise.resolve().then(() => {
      if (isStandalone || alreadyDismissed) return;
      setDismissed(false);
      setIsIos(/iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()));
    });

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  const install = async () => {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    const { outcome } = await deferredEvent.userChoice;
    if (outcome === 'accepted') setDismissed(true);
    setDeferredEvent(null);
  };

  if (dismissed) return null;
  if (!isIos && !deferredEvent) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.icon} />
      <div className={styles.body}>
        <div className={styles.title}>Instale o RunPlan</div>
        <p className={styles.subtitle}>
          {isIos
            ? 'Toque em Compartilhar (□↑) e depois em "Adicionar à Tela de Início".'
            : 'Adicione à tela inicial para abrir como um app, em tela cheia.'}
        </p>
      </div>
      {!isIos && (
        <button className={styles.installBtn} onClick={install}>
          Instalar
        </button>
      )}
      <button className={styles.closeBtn} onClick={dismiss} aria-label="Dispensar">
        ✕
      </button>
    </div>
  );
}
