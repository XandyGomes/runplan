'use client';

import { useEffect, useState } from 'react';
import ActivityMap from './ActivityMap';
import styles from './StravaActivityCard.module.css';

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

function formatPace(distanceKm: number, movingTimeMin: number) {
  if (!distanceKm) return '--';
  const paceMin = movingTimeMin / distanceKm;
  const min = Math.floor(paceMin);
  const sec = Math.round((paceMin - min) * 60);
  return `${min}:${sec.toString().padStart(2, '0')}/km`;
}

export default function StravaActivityCard({ activityId }: { activityId: string }) {
  const [detail, setDetail] = useState<ActivityDetail | null>(null);
  const [error, setError] = useState('');
  const [showSheet, setShowSheet] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/activities/${activityId}`)
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        if (data.error) setError(data.error);
        else setDetail(data);
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar a atividade.');
      });
    return () => {
      cancelled = true;
    };
  }, [activityId]);

  if (error) return null;
  if (!detail) {
    return (
      <div className={styles.card}>
        <div className={styles.badge} />
        <span className={styles.loadingText}>Carregando atividade do Strava...</span>
      </div>
    );
  }

  return (
    <>
      <div className={styles.card} onClick={() => setShowSheet(true)}>
        <div className={styles.badge} />
        <div className={styles.headerText}>
          <span className={styles.headerLabel}>Registrado no Strava</span>
          <span className={styles.headerName}>
            {detail.distanceKm}km · {detail.movingTimeMin}min · {formatPace(detail.distanceKm, detail.movingTimeMin)}
          </span>
        </div>
        <span className={styles.chevron}>›</span>
      </div>

      {showSheet && (
        <div className={styles.sheetOverlay} onClick={() => setShowSheet(false)}>
          <div className={styles.sheet} onClick={e => e.stopPropagation()}>
            <div className={styles.sheetHeader}>
              <h2>{detail.name}</h2>
              <button className={styles.closeBtn} onClick={() => setShowSheet(false)}>✕</button>
            </div>

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
          </div>
        </div>
      )}
    </>
  );
}
