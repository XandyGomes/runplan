'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

type RaceOption = { label: string; km: number };

const RACE_OPTIONS: RaceOption[] = [
  { label: '5km', km: 5 },
  { label: '10km', km: 10 },
  { label: 'Meia Maratona', km: 21.1 },
  { label: 'Maratona', km: 42.2 },
];

const LEVELS = [
  { value: 'iniciante', label: 'Iniciante' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado', label: 'Avançado' },
];

const TOTAL_STEPS = 6;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [raceOption, setRaceOption] = useState<RaceOption | null>(null);
  const [customKm, setCustomKm] = useState('10');
  const [hasRaceDate, setHasRaceDate] = useState<boolean | null>(null);
  const [raceDate, setRaceDate] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(9);
  const [level, setLevel] = useState<string | null>(null);
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [currentWeeklyKm, setCurrentWeeklyKm] = useState(15);
  const [includeStrength, setIncludeStrength] = useState(true);

  const raceKm = raceOption?.km ?? (Number(customKm) || 10);
  const raceLabel = raceOption?.label ?? `${customKm}km`;

  const canAdvance = () => {
    if (step === 0) return raceOption !== null || Number(customKm) > 0;
    if (step === 1) return hasRaceDate === false || (hasRaceDate === true && raceDate !== '');
    if (step === 2) return level !== null;
    return true;
  };

  const next = () => setStep(s => Math.min(TOTAL_STEPS - 1, s + 1));
  const back = () => setStep(s => Math.max(0, s - 1));

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raceDistanceKm: raceKm,
          raceLabel,
          raceDate: hasRaceDate ? raceDate : undefined,
          durationWeeks: hasRaceDate ? undefined : durationWeeks,
          level,
          daysPerWeek,
          currentWeeklyKm,
          includeStrength,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao gerar plano.');
        setSubmitting(false);
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      setError('Erro de conexão. Tente novamente.');
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.progress}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} className={`${styles.progressDot} ${i <= step ? styles.progressDotActive : ''}`} />
        ))}
      </div>

      {step === 0 && (
        <>
          <h1 className={styles.title}>Qual é a sua prova?</h1>
          <p className={styles.subtitle}>Vamos montar um plano periodizado para o seu objetivo.</p>
          <div className={styles.optionsGrid}>
            {RACE_OPTIONS.map(opt => (
              <button
                key={opt.label}
                className={`${styles.optionCard} ${raceOption?.label === opt.label ? styles.optionCardActive : ''}`}
                onClick={() => setRaceOption(opt)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className={styles.field}>
            <label>Ou distância personalizada (km)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={customKm}
              onChange={e => {
                setCustomKm(e.target.value);
                setRaceOption(null);
              }}
            />
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <h1 className={styles.title}>Você já tem data de prova?</h1>
          <p className={styles.subtitle}>Isso define quantas semanas seu plano vai ter.</p>
          <div className={styles.optionsGrid}>
            <button
              className={`${styles.optionCard} ${hasRaceDate === true ? styles.optionCardActive : ''}`}
              onClick={() => setHasRaceDate(true)}
            >
              Sim, tenho data
            </button>
            <button
              className={`${styles.optionCard} ${hasRaceDate === false ? styles.optionCardActive : ''}`}
              onClick={() => setHasRaceDate(false)}
            >
              Ainda não
            </button>
          </div>

          {hasRaceDate === true && (
            <div className={styles.field}>
              <label>Data da prova</label>
              <input type="date" value={raceDate} onChange={e => setRaceDate(e.target.value)} />
            </div>
          )}

          {hasRaceDate === false && (
            <div className={styles.field}>
              <label>Duração do plano: {durationWeeks} semanas</label>
              <div className={styles.stepperRow}>
                <button className={styles.stepperBtn} onClick={() => setDurationWeeks(w => Math.max(6, w - 1))}>-</button>
                <span className={styles.stepperValue}>{durationWeeks}</span>
                <button className={styles.stepperBtn} onClick={() => setDurationWeeks(w => Math.min(26, w + 1))}>+</button>
              </div>
            </div>
          )}
        </>
      )}

      {step === 2 && (
        <>
          <h1 className={styles.title}>Qual seu nível como corredor?</h1>
          <p className={styles.subtitle}>Isso ajusta o volume e a intensidade dos treinos.</p>
          <div className={styles.optionsGrid}>
            {LEVELS.map(l => (
              <button
                key={l.value}
                className={`${styles.optionCard} ${styles.optionCardWide} ${level === l.value ? styles.optionCardActive : ''}`}
                onClick={() => setLevel(l.value)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h1 className={styles.title}>Quantos dias por semana você pode treinar?</h1>
          <p className={styles.subtitle}>Contando apenas os dias de corrida (força é à parte).</p>
          <div className={styles.field}>
            <div className={styles.stepperRow}>
              <button className={styles.stepperBtn} onClick={() => setDaysPerWeek(d => Math.max(3, d - 1))}>-</button>
              <span className={styles.stepperValue}>{daysPerWeek} dias</span>
              <button className={styles.stepperBtn} onClick={() => setDaysPerWeek(d => Math.min(6, d + 1))}>+</button>
            </div>
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <h1 className={styles.title}>Qual sua quilometragem semanal atual?</h1>
          <p className={styles.subtitle}>Usamos isso como ponto de partida do plano.</p>
          <div className={styles.field}>
            <div className={styles.stepperRow}>
              <button className={styles.stepperBtn} onClick={() => setCurrentWeeklyKm(k => Math.max(0, k - 5))}>-</button>
              <span className={styles.stepperValue}>{currentWeeklyKm}km</span>
              <button className={styles.stepperBtn} onClick={() => setCurrentWeeklyKm(k => Math.min(150, k + 5))}>+</button>
            </div>
          </div>
        </>
      )}

      {step === 5 && (
        <>
          <h1 className={styles.title}>Quer incluir treino de força?</h1>
          <p className={styles.subtitle}>Sessões complementares de força, intercaladas com as corridas.</p>
          <div className={styles.optionsGrid}>
            <button
              className={`${styles.optionCard} ${includeStrength ? styles.optionCardActive : ''}`}
              onClick={() => setIncludeStrength(true)}
            >
              Sim, incluir
            </button>
            <button
              className={`${styles.optionCard} ${!includeStrength ? styles.optionCardActive : ''}`}
              onClick={() => setIncludeStrength(false)}
            >
              Só corrida
            </button>
          </div>
        </>
      )}

      {error && <p className={styles.errorText}>{error}</p>}

      <div className={styles.footer}>
        {step > 0 && (
          <button className={styles.backBtn} onClick={back} disabled={submitting}>
            Voltar
          </button>
        )}
        {step < TOTAL_STEPS - 1 ? (
          <button className="btn-primary" disabled={!canAdvance()} onClick={next}>
            Continuar
          </button>
        ) : (
          <button className="btn-primary" disabled={submitting} onClick={submit}>
            {submitting ? 'Gerando plano...' : 'Gerar meu plano'}
          </button>
        )}
      </div>
    </div>
  );
}
