'use client';

import { useState } from 'react';
import { WorkoutType, WORKOUT_TYPE_COLORS, WORKOUT_TYPE_LABEL } from '@/lib/workoutTypes';
import styles from './AddRunModal.module.css';

const TYPES: WorkoutType[] = ['easy', 'tempo', 'interval', 'hills', 'long', 'race'];

export default function AddRunModal({
  date,
  onClose,
  onCreated,
}: {
  date: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [selected, setSelected] = useState<WorkoutType | null>(null);
  const [distanceKm, setDistanceKm] = useState('5');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!selected) return;
    setSaving(true);
    await fetch('/api/workout/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, type: selected, distanceKm: Number(distanceKm) || null }),
    });
    setSaving(false);
    onCreated();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{selected ? WORKOUT_TYPE_LABEL[selected] : 'Adicionar corrida'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {!selected ? (
          <div className={styles.grid}>
            {TYPES.map(type => (
              <button
                key={type}
                className={styles.typeCard}
                style={{ background: `linear-gradient(135deg, ${WORKOUT_TYPE_COLORS[type].from}, ${WORKOUT_TYPE_COLORS[type].to})` }}
                onClick={() => setSelected(type)}
              >
                {WORKOUT_TYPE_LABEL[type]}
              </button>
            ))}
          </div>
        ) : (
          <div className={styles.field}>
            <label>Distância (km)</label>
            <input type="number" min={0} step={0.1} value={distanceKm} onChange={e => setDistanceKm(e.target.value)} />
            <button className="btn-primary" disabled={saving} onClick={submit}>
              {saving ? 'Registrando...' : 'Registrar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
