'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import ActivityMap from '@/components/ActivityMap';
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

type ActivityDetail = {
  id: string;
  name: string;
  distanceKm: number;
  movingTimeMin: number;
  elevationGain: number;
  avgHeartrate: number | null;
  calories: number | null;
  startDate: string;
  route: [number, number][];
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
  const [selected, setSelected] = useState<Activity | null>(null);
  const [detail, setDetail] = useState<ActivityDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');
  const detailCache = useRef(new Map<string, ActivityDetail>());

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

  const openDetail = (activity: Activity) => {
    setSelected(activity);
    setDetailError('');
    const cached = detailCache.current.get(activity.id);
    if (cached) {
      setDetail(cached);
      return;
    }
    setDetail(null);
    setLoadingDetail(true);
    fetch(`/api/activities/${activity.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setDetailError(data.error);
        } else {
          detailCache.current.set(activity.id, data);
          setDetail(data);
        }
      })
      .catch(() => setDetailError('Erro de conexão ao buscar a atividade.'))
      .finally(() => setLoadingDetail(false));
  };

  const closeDetail = () => {
    setSelected(null);
    setDetail(null);
    setDetailError('');
  };

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
            <div key={a.id} className={`${styles.item} pressable`} onClick={() => openDetail(a)}>
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

      {selected && (
        <div className={styles.overlay} onClick={closeDetail}>
          <div className={styles.sheet} onClick={e => e.stopPropagation()}>
            <div className={styles.sheetHeader}>
              <h2>{detail?.name || selected.name}</h2>
              <button className={styles.closeBtn} onClick={closeDetail}>✕</button>
            </div>

            {loadingDetail && <p>Carregando atividade do Strava...</p>}
            {detailError && <p style={{ color: 'var(--error)' }}>{detailError}</p>}

            {detail && (
              <>
                {detail.route.length > 0 && <ActivityMap route={detail.route} />}
                <div className={styles.statsRow} style={{ marginTop: 20 }}>
                  <div>
                    <div className={styles.statLabel}>Distância</div>
                    <div className={styles.statValue}>{detail.distanceKm}km</div>
                  </div>
                  <div>
                    <div className={styles.statLabel}>Tempo</div>
                    <div className={styles.statValue}>{detail.movingTimeMin}min</div>
                  </div>
                  <div>
                    <div className={styles.statLabel}>Ritmo médio</div>
                    <div className={styles.statValue}>{formatPace(detail.distanceKm, detail.movingTimeMin)}</div>
                  </div>
                </div>
                {(detail.elevationGain > 0 || detail.avgHeartrate || detail.calories) && (
                  <div className={styles.statsRow} style={{ marginTop: 12 }}>
                    {detail.elevationGain > 0 && (
                      <div>
                        <div className={styles.statLabel}>Elevação</div>
                        <div className={styles.statValue}>{detail.elevationGain}m</div>
                      </div>
                    )}
                    {detail.avgHeartrate && (
                      <div>
                        <div className={styles.statLabel}>FC média</div>
                        <div className={styles.statValue}>{detail.avgHeartrate}bpm</div>
                      </div>
                    )}
                    {detail.calories && (
                      <div>
                        <div className={styles.statLabel}>Calorias</div>
                        <div className={styles.statValue}>{detail.calories}</div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
