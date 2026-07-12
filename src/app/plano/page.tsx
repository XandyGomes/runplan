'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import AddRunModal from '@/components/AddRunModal';
import PaywallSheet from '@/components/PaywallSheet';
import { Plan, Workout } from '@/lib/types';
import { WORKOUT_TYPE_COLORS, WORKOUT_TYPE_LABEL, WorkoutType } from '@/lib/workoutTypes';
import styles from './page.module.css';

const DAY_LABELS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
const TYPE_PRIORITY: WorkoutType[] = ['race', 'long', 'interval', 'tempo', 'hills', 'easy', 'strength', 'rest'];

function addDaysISO(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatRange(start: string, end: string) {
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  return `De ${fmt(s)} a ${fmt(e)}`;
}

export default function PlanoPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'lista' | 'mes'>('lista');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'free' | 'premium'>('free');
  const [addRunDate, setAddRunDate] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [resettingWeek, setResettingWeek] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/plan');
    if (res.status === 401) {
      router.push('/');
      return;
    }
    const data = await res.json();
    if (!data.plan) {
      router.push('/onboarding');
      return;
    }
    setPlan(data.plan);
    setWorkouts(data.workouts);
    setLoading(false);

    const subRes = await fetch('/api/subscription');
    if (subRes.ok) {
      const subData = await subRes.json();
      setSubscriptionStatus(subData.subscriptionStatus);
    }
  }, [router]);

  useEffect(() => {
    fetch('/api/plan')
      .then(res => (res.status === 401 ? null : res.json()))
      .then(data => {
        if (!data) {
          router.push('/');
          return;
        }
        if (!data.plan) {
          router.push('/onboarding');
          return;
        }
        setPlan(data.plan);
        setWorkouts(data.workouts);
        setLoading(false);
        fetch('/api/subscription')
          .then(res => (res.ok ? res.json() : null))
          .then(subData => {
            if (subData) setSubscriptionStatus(subData.subscriptionStatus);
          });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weeks = useMemo(() => {
    if (!plan) return [];
    const map = new Map<number, Workout[]>();
    for (const w of workouts) {
      if (!map.has(w.week_number)) map.set(w.week_number, []);
      map.get(w.week_number)!.push(w);
    }
    return Array.from({ length: plan.duration_weeks }, (_, i) => {
      const weekNumber = i + 1;
      const startDate = addDaysISO(plan.start_date, i * 7);
      const endDate = addDaysISO(startDate, 6);
      const weekWorkouts = (map.get(weekNumber) || []).filter(w => !w.skipped);
      const totalKm = weekWorkouts.reduce((sum, w) => sum + (w.distance_km || 0), 0);
      return { weekNumber, startDate, endDate, workouts: weekWorkouts, totalKm: Math.round(totalKm * 10) / 10 };
    });
  }, [plan, workouts]);

  const resetWeek = async (weekNumber: number) => {
    setResettingWeek(weekNumber);
    await fetch(`/api/plan/week/${weekNumber}`, { method: 'POST' });
    await load();
    setResettingWeek(null);
  };

  if (loading || !plan) {
    return (
      <div className={styles.page}>
        <p>Carregando calendário...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Calendário</h1>
        <div className={styles.toggle}>
          <button
            className={`${styles.toggleBtn} ${viewMode === 'lista' ? styles.toggleBtnActive : ''}`}
            onClick={() => setViewMode('lista')}
          >
            Lista
          </button>
          <button
            className={`${styles.toggleBtn} ${viewMode === 'mes' ? styles.toggleBtnActive : ''}`}
            onClick={() => setViewMode('mes')}
          >
            Mês
          </button>
        </div>
      </div>

      {viewMode === 'mes' ? (
        <MonthView
          workouts={workouts}
          onDayClick={date => {
            const dayWorkouts = workouts.filter(w => w.date === date && !w.skipped);
            if (dayWorkouts.length > 0) {
              router.push(`/treino/${dayWorkouts[0].id}`);
            } else {
              setAddRunDate(date);
            }
          }}
        />
      ) : (
        weeks.map(week => {
          const locked = subscriptionStatus === 'free' && week.weekNumber > 1;
          return (
            <div key={week.weekNumber} className={styles.weekCard}>
              <div className={styles.weekHeader}>
                <div className={styles.weekHeaderLeft}>
                  <b>
                    {formatRange(week.startDate, week.endDate)}
                    <span className={styles.badge}>SEMANA {week.weekNumber}</span>
                  </b>
                  <span style={{ color: 'var(--text-2)', fontSize: 13 }}>Total: {week.totalKm}km</span>
                </div>
                <button
                  className={styles.resetBtn}
                  disabled={resettingWeek === week.weekNumber}
                  onClick={() => resetWeek(week.weekNumber)}
                >
                  ↻ Redefinir
                </button>
              </div>

              {Array.from({ length: 7 }).map((_, i) => {
                const date = addDaysISO(week.startDate, i);
                const dayWorkouts = week.workouts.filter(w => w.date === date);
                return (
                  <div key={date} className={styles.dayRow}>
                    <div className={styles.dayLabelCol}>
                      <span>{DAY_LABELS[i]}</span>
                      <b>{Number(date.slice(8, 10))}</b>
                    </div>
                    {dayWorkouts.length > 0 ? (
                      <>
                        <div
                          className={styles.dayBar}
                          style={{
                            background: `linear-gradient(180deg, ${WORKOUT_TYPE_COLORS[dayWorkouts[0].type].from}, ${WORKOUT_TYPE_COLORS[dayWorkouts[0].type].to})`,
                          }}
                        />
                        <div
                          className={`${styles.dayContent} pressable`}
                          onClick={() => router.push(`/treino/${dayWorkouts[0].id}`)}
                        >
                          <div className={styles.dayTitle}>{dayWorkouts[0].title}</div>
                          <div className={styles.dayMeta}>{WORKOUT_TYPE_LABEL[dayWorkouts[0].type]}</div>
                        </div>
                      </>
                    ) : (
                      <button className={styles.addBtn} onClick={() => setAddRunDate(date)}>
                        + Adicionar
                      </button>
                    )}
                  </div>
                );
              })}

              {locked && (
                <div className={`${styles.lockOverlay} pressable`} onClick={() => setShowPaywall(true)}>
                  <span className={styles.lockPill}>🔒 Assinar para desbloquear</span>
                </div>
              )}
            </div>
          );
        })
      )}

      {addRunDate && (
        <AddRunModal
          date={addRunDate}
          onClose={() => setAddRunDate(null)}
          onCreated={() => {
            setAddRunDate(null);
            load();
          }}
        />
      )}

      {showPaywall && (
        <PaywallSheet
          onClose={() => setShowPaywall(false)}
          onUnlocked={() => {
            setShowPaywall(false);
            setSubscriptionStatus('premium');
          }}
        />
      )}

      <BottomNav />
    </div>
  );
}

function MonthView({ workouts, onDayClick }: { workouts: Workout[]; onDayClick: (date: string) => void }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // 0 = Seg
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (string | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }

  const primaryTypeForDate = (date: string) => {
    const dayWorkouts = workouts.filter(w => w.date === date && !w.skipped);
    for (const t of TYPE_PRIORITY) {
      const found = dayWorkouts.find(w => w.type === t);
      if (found) return t;
    }
    return dayWorkouts[0]?.type || null;
  };

  return (
    <div className={styles.monthGrid}>
      {DAY_LABELS.map(l => (
        <div key={l} className={styles.monthDayLabel}>
          {l}
        </div>
      ))}
      {cells.map((date, i) => {
        if (!date) return <div key={i} className={`${styles.monthCell} ${styles.monthCellEmpty}`} />;
        const type = primaryTypeForDate(date);
        return (
          <div key={date} className={`${styles.monthCell} pressable`} onClick={() => onDayClick(date)}>
            <span>{Number(date.slice(8, 10))}</span>
            {type ? (
              <span
                className={styles.monthDot}
                style={{ background: `linear-gradient(135deg, ${WORKOUT_TYPE_COLORS[type].from}, ${WORKOUT_TYPE_COLORS[type].to})` }}
              />
            ) : (
              <span className={styles.monthDot} style={{ background: 'transparent' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
