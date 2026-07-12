'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Workout } from '@/lib/types';
import { WORKOUT_TYPE_COLORS, WORKOUT_TYPE_LABEL } from '@/lib/workoutTypes';
import { getClientCookie } from '@/lib/cookies';
import { STRENGTH_ROUTINES } from '@/lib/strengthExercises';
import CoachMessage from '@/components/CoachMessage';
import ExerciseIcon from '@/components/ExerciseIcon';
import ActivityMap from '@/components/ActivityMap';
import styles from './page.module.css';

type RecentActivity = { id: string; name: string; distanceKm: number; movingTimeMin: number; startDate: string };

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

function formatDateLong(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTimer(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function WorkoutDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  const [showSummarySheet, setShowSummarySheet] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [refreshingSummary, setRefreshingSummary] = useState(false);
  const [outdoorMode, setOutdoorMode] = useState<'ar_livre' | 'esteira'>('ar_livre');
  const [expandedRoute, setExpandedRoute] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showLinkActivity, setShowLinkActivity] = useState(false);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [showActivitySheet, setShowActivitySheet] = useState(false);
  const [activityDetail, setActivityDetail] = useState<ActivityDetail | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [activityError, setActivityError] = useState('');

  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`/api/workout/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setUserName(getClientCookie('user_name'));
        setWorkout(data.workout || null);
        setLoading(false);
      });
  }, [params.id]);

  useEffect(() => {
    if (sessionStarted) {
      timerRef.current = setInterval(() => setSessionSeconds(s => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionStarted]);

  const patchWorkout = async (body: Record<string, unknown>) => {
    await fetch(`/api/workout/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  const handleSkip = async () => {
    await patchWorkout({ action: 'skip' });
    router.back();
  };

  const handleRefreshSummary = async () => {
    setRefreshingSummary(true);
    const res = await fetch(`/api/workout/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'refresh_summary' }),
    });
    const data = await res.json();
    if (data.ai_summary && workout) {
      setWorkout({ ...workout, ai_summary: data.ai_summary });
    }
    setRefreshingSummary(false);
  };

  const openActivityDetail = async () => {
    if (!workout?.linked_strava_activity_id) return;
    setShowActivitySheet(true);
    if (activityDetail) return;
    setLoadingActivity(true);
    setActivityError('');
    try {
      const res = await fetch(`/api/activities/${workout.linked_strava_activity_id}`);
      const data = await res.json();
      if (!res.ok) {
        setActivityError(data.error || 'Não foi possível carregar a atividade.');
      } else {
        setActivityDetail(data);
      }
    } catch {
      setActivityError('Erro de conexão ao buscar a atividade.');
    }
    setLoadingActivity(false);
  };

  const openLinkActivity = async () => {
    setShowMenu(false);
    setShowLinkActivity(true);
    const res = await fetch('/api/activities/recent');
    const data = await res.json();
    setRecentActivities(data.activities || []);
  };

  const linkActivity = async (activityId: string) => {
    await patchWorkout({ action: 'link_activity', activityId });
    setShowLinkActivity(false);
    if (workout) setWorkout({ ...workout, completed_at: new Date().toISOString(), linked_strava_activity_id: activityId });
  };

  const share = async () => {
    setShowMenu(false);
    if (!workout) return;
    const text = `${workout.title} — ${WORKOUT_TYPE_LABEL[workout.type]}`;
    if (navigator.share) {
      navigator.share({ title: workout.title, text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
    }
  };

  const finishSession = async () => {
    setSessionStarted(false);
    await patchWorkout({ action: 'complete' });
    router.push('/');
  };

  if (loading || !workout) {
    return (
      <div className={styles.page}>
        <p>Carregando treino...</p>
      </div>
    );
  }

  const colors = WORKOUT_TYPE_COLORS[workout.type];

  if (sessionStarted) {
    return (
      <div className={styles.sessionWrap}>
        <p>{workout.title}</p>
        <div className={styles.sessionTimer}>{formatTimer(sessionSeconds)}</div>
        <button className="btn-primary" onClick={finishSession}>
          Concluir treino
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.iconBtn} onClick={() => router.back()} aria-label="Voltar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className={styles.topRight}>
          <button className={styles.iconBtn} onClick={() => setShowMenu(true)} aria-label="Mais opções">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="19" cy="12" r="1.8" />
            </svg>
          </button>
        </div>
      </div>

      <h1>{workout.title}</h1>
      <div className={styles.type}>
        <span className={styles.dot} style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }} />
        {WORKOUT_TYPE_LABEL[workout.type]} · {formatDateLong(workout.date)}
      </div>

      <div className={styles.statsRow}>
        {workout.distance_km && (
          <div>
            <div className={styles.statLabel}>Distância</div>
            <div className={styles.statValue}>{workout.distance_km}km</div>
          </div>
        )}
        {workout.duration_min_low && (
          <div>
            <div className={styles.statLabel}>Tempo</div>
            <div className={styles.statValue}>
              {workout.duration_min_low}m - {workout.duration_min_high}m
            </div>
          </div>
        )}
      </div>

      {workout.ai_summary && (
        <div className={`${styles.summaryCard} pressable`} onClick={() => setShowSummarySheet(true)}>
          <div className={styles.summaryIcon} />
          <div className={styles.summaryText}>{workout.ai_summary}</div>
          <span>›</span>
        </div>
      )}

      {workout.linked_strava_activity_id && (
        <div className={`${styles.summaryCard} pressable`} onClick={openActivityDetail}>
          <div className={styles.summaryIcon} style={{ background: 'linear-gradient(135deg, #FC4C02, #FF7A1A)' }} />
          <div className={styles.summaryText}>Ver atividade registrada no Strava, com mapa e estatísticas reais</div>
          <span>›</span>
        </div>
      )}

      <div className={styles.divider} />

      {workout.type === 'strength' ? (
        <>
          <h3 style={{ marginBottom: 4 }}>Exercícios</h3>
          <p style={{ marginBottom: 16 }}>Bodyweight, sem equipamento. Descanse ~30-45s entre séries.</p>
          {(STRENGTH_ROUTINES[workout.title] || []).map(exercise => (
            <div key={exercise.name} className={styles.exerciseRow}>
              <div className={styles.exerciseIcon}>
                <ExerciseIcon icon={exercise.icon} />
              </div>
              <div className={styles.blockBody}>
                <b>{exercise.name}</b>
                <p className={styles.exerciseReps}>{exercise.reps}</p>
                <p>{exercise.cue}</p>
              </div>
            </div>
          ))}
        </>
      ) : (
        <>
          <div className={styles.toggleRow}>
            <h3>Detalhes</h3>
            <div className={styles.toggle}>
              <button
                className={`${styles.toggleBtn} ${outdoorMode === 'ar_livre' ? styles.toggleBtnActive : ''}`}
                onClick={() => setOutdoorMode('ar_livre')}
              >
                Ao ar livre
              </button>
              <button
                className={`${styles.toggleBtn} ${outdoorMode === 'esteira' ? styles.toggleBtnActive : ''}`}
                onClick={() => setOutdoorMode('esteira')}
              >
                Esteira
              </button>
            </div>
          </div>

          <div className={styles.block}>
            <span className={styles.blockIcon}>▶</span>
            <div className={styles.blockBody}>
              <b>Alongamentos de aquecimento (2 min)</b>
            </div>
          </div>

          <div className={styles.block}>
            <div className={styles.blockBar} style={{ background: `linear-gradient(180deg, ${colors.from}, ${colors.to})` }} />
            <div className={styles.blockBody}>
              <b>{workout.title}</b>
              {workout.pace_guidance && <p>{workout.pace_guidance}</p>}
            </div>
          </div>

          <div className={styles.block}>
            <span className={styles.blockIcon}>▶</span>
            <div className={styles.blockBody}>
              <b>Alongamentos de desaquecimento (4 min)</b>
            </div>
          </div>
        </>
      )}

      <CoachMessage userName={userName} message={workout.ai_summary} />

      <div className={`${styles.expandRow} pressable`} onClick={() => setExpandedRoute(v => !v)}>
        <b>Encontrar uma rota</b>
        <span>{expandedRoute ? '−' : '+'}</span>
      </div>
      {expandedRoute && <p className={styles.expandBody}>Em breve: sugestões de rotas próximas com base na sua localização.</p>}

      <div className={`${styles.expandRow} pressable`} onClick={() => setExpandedNotes(v => !v)}>
        <b>Anotações de treinos</b>
        <span>{expandedNotes ? '−' : '+'}</span>
      </div>
      {expandedNotes && <p className={styles.expandBody}>Em breve: adicione anotações pessoais sobre como foi o treino.</p>}

      <div className={styles.footer}>
        <button className="btn-primary" onClick={() => setSessionStarted(true)}>
          Iniciar treino
        </button>
      </div>

      {showSummarySheet && (
        <div className={styles.sheetOverlay} onClick={() => setShowSummarySheet(false)}>
          <div className={styles.sheet} onClick={e => e.stopPropagation()}>
            <div className={styles.sheetHeader}>
              <h2>Seu resumo de treino</h2>
              <button className={styles.closeBtn} onClick={() => setShowSummarySheet(false)}>✕</button>
            </div>
            <p>{workout.ai_summary}</p>
            <div className={styles.feedbackRow}>
              <button
                className={`${styles.feedbackBtn} ${feedback === 'down' ? styles.feedbackBtnActive : ''}`}
                onClick={() => setFeedback('down')}
              >
                👎
              </button>
              <button
                className={`${styles.feedbackBtn} ${feedback === 'up' ? styles.feedbackBtnActive : ''}`}
                onClick={() => setFeedback('up')}
              >
                👍
              </button>
              <button className={styles.feedbackBtn} disabled={refreshingSummary} onClick={handleRefreshSummary}>
                ↻
              </button>
            </div>
          </div>
        </div>
      )}

      {showMenu && (
        <div className={styles.sheetOverlay} onClick={() => setShowMenu(false)}>
          <div className={styles.sheet} onClick={e => e.stopPropagation()}>
            <button className={styles.menuOption} onClick={handleSkip}>
              ⏭ Pular treino
            </button>
            <button className={styles.menuOption} onClick={openLinkActivity}>
              🔗 Vincular atividade
            </button>
            <button className={styles.menuOption} onClick={share}>
              ↗ Compartilhar com amigos
            </button>
          </div>
        </div>
      )}

      {showLinkActivity && (
        <div className={styles.sheetOverlay} onClick={() => setShowLinkActivity(false)}>
          <div className={styles.sheet} onClick={e => e.stopPropagation()}>
            <div className={styles.sheetHeader}>
              <h2>Vincular atividade do Strava</h2>
              <button className={styles.closeBtn} onClick={() => setShowLinkActivity(false)}>✕</button>
            </div>
            {recentActivities.length === 0 && <p>Nenhuma corrida recente encontrada no Strava.</p>}
            {recentActivities.map(a => (
              <div key={a.id} className={`${styles.activityOption} pressable`} onClick={() => linkActivity(a.id)}>
                <div>
                  <b>{a.name}</b>
                  <p style={{ margin: 0 }}>
                    {a.distanceKm}km · {a.movingTimeMin}min
                  </p>
                </div>
                <span>›</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showActivitySheet && (
        <div className={styles.sheetOverlay} onClick={() => setShowActivitySheet(false)}>
          <div className={styles.sheet} onClick={e => e.stopPropagation()}>
            <div className={styles.sheetHeader}>
              <h2>{activityDetail?.name || 'Atividade do Strava'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowActivitySheet(false)}>✕</button>
            </div>

            {loadingActivity && <p>Carregando atividade do Strava...</p>}
            {activityError && <p style={{ color: 'var(--error)' }}>{activityError}</p>}

            {activityDetail && (
              <>
                <ActivityMap route={activityDetail.route} />
                <div className={styles.statsRow} style={{ marginTop: 20 }}>
                  <div>
                    <div className={styles.statLabel}>Distância</div>
                    <div className={styles.statValue}>{activityDetail.distanceKm}km</div>
                  </div>
                  <div>
                    <div className={styles.statLabel}>Tempo</div>
                    <div className={styles.statValue}>{activityDetail.movingTimeMin}min</div>
                  </div>
                  <div>
                    <div className={styles.statLabel}>Ritmo médio</div>
                    <div className={styles.statValue}>{formatPace(activityDetail.distanceKm, activityDetail.movingTimeMin)}</div>
                  </div>
                </div>
                <div className={styles.statsRow} style={{ marginTop: 12 }}>
                  {activityDetail.elevationGain > 0 && (
                    <div>
                      <div className={styles.statLabel}>Elevação</div>
                      <div className={styles.statValue}>{activityDetail.elevationGain}m</div>
                    </div>
                  )}
                  {activityDetail.avgHeartrate && (
                    <div>
                      <div className={styles.statLabel}>FC média</div>
                      <div className={styles.statValue}>{activityDetail.avgHeartrate}bpm</div>
                    </div>
                  )}
                  {activityDetail.calories && (
                    <div>
                      <div className={styles.statLabel}>Calorias</div>
                      <div className={styles.statValue}>{activityDetail.calories}</div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
