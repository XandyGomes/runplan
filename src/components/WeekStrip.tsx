'use client';

import { useRouter } from 'next/navigation';
import { Workout } from '@/lib/types';
import { WORKOUT_TYPE_COLORS, WorkoutType } from '@/lib/workoutTypes';
import styles from './WeekStrip.module.css';

const DAY_LABELS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];

const TYPE_PRIORITY: WorkoutType[] = ['race', 'long', 'interval', 'tempo', 'hills', 'easy', 'strength', 'rest'];

function primaryTypeForDay(dayWorkouts: Workout[]): WorkoutType | null {
  const active = dayWorkouts.filter(w => !w.skipped);
  if (active.length === 0) return null;
  for (const t of TYPE_PRIORITY) {
    const found = active.find(w => w.type === t);
    if (found) return t;
  }
  return active[0].type;
}

function addDaysISO(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function WeekStrip({
  weekStartDate,
  workouts,
  selectedDate,
  onSelectDate,
  weekNumber,
  totalWeeks,
  onPrevWeek,
  onNextWeek,
}: {
  weekStartDate: string;
  workouts: Workout[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  weekNumber: number;
  totalWeeks: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}) {
  const router = useRouter();
  const todayISO = new Date().toISOString().slice(0, 10);
  const days = Array.from({ length: 7 }).map((_, i) => addDaysISO(weekStartDate, i));

  const completedDays = days.filter(date => {
    const dw = workouts.filter(w => w.date === date && !w.skipped);
    return dw.length > 0 && dw.every(w => w.completed_at);
  }).length;
  const ringPct = Math.round((completedDays / 7) * 100);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <button className={styles.navBtn} onClick={onPrevWeek} aria-label="Semana anterior">‹</button>
        <button className={styles.weekLabel} onClick={() => router.push('/plano')} aria-label="Ver calendário completo">
          <svg className={styles.ring} viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" fill="none" stroke="var(--border)" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="3"
              strokeDasharray={`${(ringPct / 100) * 94.2} 94.2`}
              strokeLinecap="round"
              transform="rotate(-90 18 18)"
            />
          </svg>
          Semana {weekNumber}/{totalWeeks} ▾
        </button>
        <button className={styles.navBtn} onClick={onNextWeek} aria-label="Próxima semana">›</button>
      </div>

      <div className={styles.days}>
        {days.map((date, i) => {
          const dayWorkouts = workouts.filter(w => w.date === date);
          const type = primaryTypeForDay(dayWorkouts);
          const selected = date === selectedDate;
          const isToday = date === todayISO;
          return (
            <button key={date} className={styles.day} onClick={() => onSelectDate(date)}>
              <span className={styles.dayLabel}>{DAY_LABELS[i]}</span>
              <span className={`${styles.dayNumberWrap} ${selected ? styles.daySelected : ''} ${isToday ? styles.dayToday : ''}`}>
                {Number(date.slice(8, 10))}
              </span>
              {type ? (
                <span
                  className={styles.dot}
                  style={{ background: `linear-gradient(135deg, ${WORKOUT_TYPE_COLORS[type].from}, ${WORKOUT_TYPE_COLORS[type].to})` }}
                />
              ) : (
                <span className={styles.dotPlaceholder} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
