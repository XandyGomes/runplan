'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plan, Workout } from '@/lib/types';
import WeekStrip from '@/components/WeekStrip';
import WorkoutCard from '@/components/WorkoutCard';
import StravaActivityCard from '@/components/StravaActivityCard';
import RestDayCard from '@/components/RestDayCard';
import WeekOverviewSheet from '@/components/WeekOverviewSheet';
import AddRunModal from '@/components/AddRunModal';
import InstallPrompt from '@/components/InstallPrompt';
import { todayISOInBrazil } from '@/lib/dates';
import styles from './page.module.css';

function addDaysISO(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const todayISO = () => todayISOInBrazil();

type StravaActivitySummary = { id: string; distanceKm: number; movingTimeMin: number; startDate: string };

export default function HomeClient({ userName, userPhoto }: { userName: string; userPhoto: string }) {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [weekNumber, setWeekNumber] = useState(1);
  const [showAddRun, setShowAddRun] = useState(false);
  const [weather, setWeather] = useState<{ temp: number } | null>(null);
  const [stravaActivities, setStravaActivities] = useState<StravaActivitySummary[]>([]);

  const applyPlanData = (data: { plan: Plan; workouts: Workout[] }) => {
    setPlan(data.plan);
    setWorkouts(data.workouts);
    // floor (não round) — arredondar pra cima empurrava a semana pra frente sempre que
    // já era tarde no último dia da semana (ex: domingo à noite virava "semana seguinte").
    const daysDiff = Math.floor((Date.now() - new Date(`${data.plan.start_date}T00:00:00`).getTime()) / 86400000);
    const wn = Math.min(data.plan.duration_weeks, Math.max(1, Math.floor(daysDiff / 7) + 1));
    setWeekNumber(wn);
    setLoading(false);
  };

  const loadPlan = useCallback(async () => {
    const res = await fetch('/api/plan');
    const data = await res.json();
    if (!data.plan) {
      router.push('/onboarding');
      return;
    }
    applyPlanData(data);
  }, [router]);

  useEffect(() => {
    fetch('/api/plan')
      .then(res => res.json())
      .then(data => {
        if (!data.plan) {
          router.push('/onboarding');
          return;
        }
        applyPlanData(data);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch('/api/activities/sync', { method: 'POST' })
      .then(() => Promise.all([fetch('/api/plan'), fetch('/api/activities')]))
      .then(([planRes, activitiesRes]) => Promise.all([planRes.json(), activitiesRes.json()]))
      .then(([planData, activitiesData]) => {
        if (planData.plan) applyPlanData(planData);
        if (activitiesData.activities) setStravaActivities(activitiesData.activities);
      });
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current=temperature_2m`
        )
          .then(r => r.json())
          .then(d => {
            if (typeof d?.current?.temperature_2m === 'number') {
              setWeather({ temp: Math.round(d.current.temperature_2m) });
            }
          })
          .catch(() => {});
      },
      () => {},
      { timeout: 4000 }
    );
  }, []);

  const weekStartDate = useMemo(() => {
    if (!plan) return selectedDate;
    return addDaysISO(plan.start_date, (weekNumber - 1) * 7);
  }, [plan, weekNumber, selectedDate]);

  const weekWorkouts = useMemo(() => workouts.filter(w => w.week_number === weekNumber), [workouts, weekNumber]);
  const dayWorkouts = useMemo(() => workouts.filter(w => w.date === selectedDate && !w.skipped), [workouts, selectedDate]);

  const linkedActivityIds = useMemo(
    () => new Set(workouts.map(w => w.linked_strava_activity_id).filter((id): id is string => !!id)),
    [workouts]
  );
  // Atividades do dia (ex.: caminhadas) que não foram vinculadas a nenhum treino do plano,
  // mas que ainda assim aconteceram nesse dia e merecem aparecer na tela Hoje.
  const extraDayActivities = useMemo(
    () =>
      stravaActivities.filter(
        a => a.startDate.slice(0, 10) === selectedDate && !linkedActivityIds.has(a.id)
      ),
    [stravaActivities, selectedDate, linkedActivityIds]
  );

  const toggleComplete = async (id: string) => {
    const w = workouts.find(x => x.id === id);
    if (!w) return;
    const action = w.completed_at ? 'uncomplete' : 'complete';
    setWorkouts(prev =>
      prev.map(x => (x.id === id ? { ...x, completed_at: action === 'complete' ? new Date().toISOString() : null } : x))
    );
    await fetch(`/api/workout/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
  };

  const goToWeek = (nextWeek: number) => {
    if (!plan) return;
    const clamped = Math.min(plan.duration_weeks, Math.max(1, nextWeek));
    setWeekNumber(clamped);
    setSelectedDate(addDaysISO(plan.start_date, (clamped - 1) * 7));
  };

  if (loading || !plan) {
    return (
      <div className={styles.center}>
        <p>Carregando seu plano...</p>
      </div>
    );
  }

  const isRest = dayWorkouts.length === 0 && extraDayActivities.length === 0;
  const isToday = selectedDate === todayISO();

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <Link href="/perfil" aria-label="Perfil">
          {userPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={userPhoto} alt={userName} className={styles.avatar} />
          ) : (
            <div className={styles.avatar} />
          )}
        </Link>
        <button className={styles.iconBtn} aria-label="Notificações">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
        <div className={styles.topBarSpacer} />
        <Link href="/plano" className={styles.iconBtn} aria-label="Calendário">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </Link>
      </div>

      <InstallPrompt />

      <WeekStrip
        weekStartDate={weekStartDate}
        workouts={workouts}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        weekNumber={weekNumber}
        totalWeeks={plan.duration_weeks}
        onPrevWeek={() => goToWeek(weekNumber - 1)}
        onNextWeek={() => goToWeek(weekNumber + 1)}
      />

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>{isToday ? 'Treinos de hoje' : 'Treinos'}</h2>
          {weather && <span className={styles.weather}>☁️ {weather.temp}°</span>}
        </div>

        {isRest ? (
          <RestDayCard userName={userName} />
        ) : (
          <div className={styles.cardsStack}>
            {dayWorkouts.map(w => (
              <div key={w.id} className={styles.cardsStack}>
                <WorkoutCard
                  workout={w}
                  onClick={() => router.push(`/treino/${w.id}`)}
                  onToggleComplete={() => toggleComplete(w.id)}
                />
                {w.linked_strava_activity_id && <StravaActivityCard activityId={w.linked_strava_activity_id} />}
              </div>
            ))}
            {extraDayActivities.map(a => (
              <StravaActivityCard key={a.id} activityId={a.id} />
            ))}
          </div>
        )}
      </div>

      <div className={styles.section}>
        <WeekOverviewSheet
          weekNumber={weekNumber}
          workouts={weekWorkouts}
          onOpenWorkout={id => router.push(`/treino/${id}`)}
          onToggleComplete={toggleComplete}
        />
      </div>

      <button className={styles.floatingBtn} onClick={() => setShowAddRun(true)}>
        ▶ Registrar treino
      </button>

      {showAddRun && (
        <AddRunModal
          date={selectedDate}
          onClose={() => setShowAddRun(false)}
          onCreated={() => {
            setShowAddRun(false);
            loadPlan();
          }}
        />
      )}
    </div>
  );
}
