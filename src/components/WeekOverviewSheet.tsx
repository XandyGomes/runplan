'use client';

import { useState } from 'react';
import { Workout } from '@/lib/types';
import { isRunningType } from '@/lib/workoutTypes';
import WorkoutCard from './WorkoutCard';
import styles from './WeekOverviewSheet.module.css';

export default function WeekOverviewSheet({
  weekNumber,
  workouts,
  onOpenWorkout,
  onToggleComplete,
}: {
  weekNumber: number;
  workouts: Workout[];
  onOpenWorkout: (id: string) => void;
  onToggleComplete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = workouts.filter(w => !w.skipped);
  const done = active.filter(w => w.completed_at).length;
  const totalKm = active.filter(w => isRunningType(w.type)).reduce((sum, w) => sum + (w.distance_km || 0), 0);

  return (
    <>
      <div className={`${styles.summaryCard} pressable`} onClick={() => setOpen(true)}>
        <div className={styles.summaryHeader}>
          <span>Visão geral da semana {weekNumber}</span>
          <span>›</span>
        </div>
        <div className={styles.segments}>
          {active.map((w, i) => (
            <div key={i} className={`${styles.segment} ${w.completed_at ? styles.segmentDone : ''}`} />
          ))}
        </div>
        <div className={styles.statsRow}>
          <span>
            Exercícios: <b>{done}/{active.length}</b>
          </span>
          <span>
            Distância: <b>{Math.round(totalKm * 10) / 10}KM</b>
          </span>
        </div>
      </div>

      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div className={styles.sheet} onClick={e => e.stopPropagation()}>
            <div className={styles.sheetHeader}>
              <h2>Visão geral da semana {weekNumber}</h2>
              <button className={styles.closeBtn} onClick={() => setOpen(false)}>✕</button>
            </div>
            <p className={styles.sheetMeta}>
              Total de treinos: {active.length} · Distância: {Math.round(totalKm * 10) / 10}km
            </p>
            <div className={styles.list}>
              {active.map(w => (
                <WorkoutCard
                  key={w.id}
                  workout={w}
                  onClick={() => {
                    setOpen(false);
                    onOpenWorkout(w.id);
                  }}
                  onToggleComplete={() => onToggleComplete(w.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
