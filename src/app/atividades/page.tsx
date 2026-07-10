'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import styles from './page.module.css';

type Activity = {
  id: string;
  name: string;
  type: string;
  distanceKm: number;
  movingTimeMin: number;
  elevationGain: number;
  startDate: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatPace(distanceKm: number, movingTimeMin: number) {
  if (!distanceKm) return '--';
  const paceMin = movingTimeMin / distanceKm;
  const min = Math.floor(paceMin);
  const sec = Math.round((paceMin - min) * 60);
  return `${min}:${sec.toString().padStart(2, '0')}/km`;
}

export default function AtividadesPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/activities')
      .then(res => {
        if (res.status === 401) {
          router.push('/');
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data) setActivities(data.activities || []);
        setLoading(false);
      });
  }, [router]);

  const { weekKm, weekCount } = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = activities.filter(a => new Date(a.startDate).getTime() >= weekAgo);
    return {
      weekKm: Math.round(recent.reduce((sum, a) => sum + a.distanceKm, 0) * 10) / 10,
      weekCount: recent.length,
    };
  }, [activities]);

  return (
    <div className={styles.page}>
      <h1 style={{ marginBottom: 20 }}>Atividades</h1>

      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryValue}>{weekKm}km</div>
          <div className={styles.summaryLabel}>Últimos 7 dias</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryValue}>{weekCount}</div>
          <div className={styles.summaryLabel}>Atividades</div>
        </div>
      </div>

      {loading ? (
        <p>Carregando atividades do Strava...</p>
      ) : activities.length === 0 ? (
        <p className={styles.empty}>Nenhuma atividade encontrada no Strava ainda.</p>
      ) : (
        <div className={styles.list}>
          {activities.map(a => (
            <div key={a.id} className={styles.item}>
              <div className={styles.itemHeader}>
                <span className={styles.itemName}>{a.name}</span>
                <span className={styles.itemDate}>{formatDate(a.startDate)}</span>
              </div>
              <div className={styles.itemStats}>
                <span>
                  <b>{a.distanceKm}</b> km
                </span>
                <span>
                  <b>{a.movingTimeMin}</b> min
                </span>
                <span>
                  <b>{formatPace(a.distanceKm, a.movingTimeMin)}</b>
                </span>
                {a.elevationGain > 0 && (
                  <span>
                    <b>{a.elevationGain}</b> m
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
