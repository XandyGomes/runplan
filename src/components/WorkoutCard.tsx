'use client';

import { Workout } from '@/lib/types';
import { WORKOUT_TYPE_COLORS, WORKOUT_TYPE_LABEL } from '@/lib/workoutTypes';
import styles from './WorkoutCard.module.css';

function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' });
}

export default function WorkoutCard({
  workout,
  onClick,
  onToggleComplete,
}: {
  workout: Workout;
  onClick: () => void;
  onToggleComplete: () => void;
}) {
  const colors = WORKOUT_TYPE_COLORS[workout.type];
  const done = !!workout.completed_at;

  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.bar} style={{ background: `linear-gradient(180deg, ${colors.from}, ${colors.to})` }} />
      <div className={styles.body}>
        <div className={`${styles.title} ${done ? styles.titleDone : ''}`}>{workout.title}</div>
        <div className={styles.meta}>
          {formatDate(workout.date)}
          {workout.duration_min_low ? ` · ${workout.duration_min_low}m - ${workout.duration_min_high}m` : ''}
        </div>
        <div className={styles.type}>
          {WORKOUT_TYPE_LABEL[workout.type]}
          {workout.distance_km ? ` · ${workout.distance_km}km` : ''}
        </div>
      </div>
      <div className={styles.checkboxWrap}>
        <button
          className={`${styles.checkbox} ${done ? styles.checkboxDone : ''}`}
          onClick={e => {
            e.stopPropagation();
            onToggleComplete();
          }}
          aria-label={done ? 'Marcar como não concluído' : 'Marcar como concluído'}
        >
          {done ? '✓' : ''}
        </button>
      </div>
    </div>
  );
}
