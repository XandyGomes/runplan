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

type GeneratedWeek = { weekNumber: number; startDate: string; endDate: string; totalKm: number; phase: string };
type GeneratedWorkout = {
  weekNumber: number;
  date: string;
  type: string;
  title: string;
  distanceKm: number | null;
  durationMinLow: number | null;
  durationMinHigh: number | null;
};
type Assessment = { peakWeeklyKm: number; peakLongRunKm: number; idealPeakWeeklyKm: number; realistic: boolean; note: string };
type SimResult = { weeks: GeneratedWeek[]; workouts: GeneratedWorkout[]; assessment: Assessment; coachNote: string | null };

export default function SimularPage() {
  const router = useRouter();
  const [raceOption, setRaceOption] = useState<RaceOption | null>(RACE_OPTIONS[2]);
  const [customKm, setCustomKm] = useState('');
  const [raceDate, setRaceDate] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(9);
  const [level, setLevel] = useState('intermediario');
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [currentWeeklyKm, setCurrentWeeklyKm] = useState(15);
  const [includeStrength, setIncludeStrength] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SimResult | null>(null);

  const raceKm = raceOption?.km ?? (Number(customKm) || 10);
  const raceLabel = raceOption?.label ?? `${customKm || 10}km`;

  const simulate = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/plan/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raceDistanceKm: raceKm,
          raceLabel,
          raceDate: raceDate || undefined,
          durationWeeks: raceDate ? undefined : durationWeeks,
          level,
          daysPerWeek,
          currentWeeklyKm,
          includeStrength,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao simular o plano.');
      } else {
        setResult(data);
      }
    } catch {
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!result) return;
    const lines: string[] = [];
    lines.push(`SIMULAÇÃO DE PLANO — ${raceLabel}`);
    lines.push(`Nível: ${level} · ${daysPerWeek} dias/semana · ${result.weeks.length} semanas`);
    lines.push(`Pico previsto: ${result.assessment.peakWeeklyKm}km/semana · treino longo até ${result.assessment.peakLongRunKm}km`);
    if (result.coachNote) lines.push(`\nDevolutiva do treinador:\n${result.coachNote}`);
    lines.push('\n--- TREINOS ---');
    for (const w of result.workouts) {
      const dist = w.distanceKm ? ` — ${w.distanceKm}km` : '';
      const dur = w.durationMinLow ? ` (${w.durationMinLow}-${w.durationMinHigh}min)` : '';
      lines.push(`Semana ${w.weekNumber} · ${w.date} · ${w.title}${dist}${dur}`);
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plano-simulado-${raceLabel.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.wrap}>
      <button className={styles.backLink} onClick={() => router.back()}>‹ Voltar</button>
      <h1 className={styles.title}>Simular outro plano</h1>
      <p className={styles.subtitle}>
        Isso NÃO substitui seu plano atual — é só pra você ver como ficaria com outro objetivo. Se gostar, use &ldquo;Gerar
        novo plano&rdquo; no Perfil pra ativar de verdade.
      </p>

      {!result && (
        <>
          <div className={styles.field}>
            <label>Distância da prova</label>
            <div className={styles.optionsGrid}>
              {RACE_OPTIONS.map(opt => (
                <button
                  key={opt.label}
                  className={`${styles.optionCard} ${raceOption?.label === opt.label ? styles.optionCardActive : ''}`}
                  onClick={() => {
                    setRaceOption(opt);
                    setCustomKm('');
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <input
              type="number"
              placeholder="Ou km personalizado"
              value={customKm}
              onChange={e => {
                setCustomKm(e.target.value);
                setRaceOption(null);
              }}
            />
          </div>

          <div className={styles.field}>
            <label>Data da prova (opcional)</label>
            <input type="date" value={raceDate} onChange={e => setRaceDate(e.target.value)} />
          </div>

          {!raceDate && (
            <div className={styles.field}>
              <label>Duração: {durationWeeks} semanas</label>
              <div className={styles.stepperRow}>
                <button className={styles.stepperBtn} onClick={() => setDurationWeeks(w => Math.max(6, w - 1))}>-</button>
                <span>{durationWeeks}</span>
                <button className={styles.stepperBtn} onClick={() => setDurationWeeks(w => Math.min(26, w + 1))}>+</button>
              </div>
            </div>
          )}

          <div className={styles.field}>
            <label>Nível</label>
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
          </div>

          <div className={styles.field}>
            <label>Dias de corrida/semana: {daysPerWeek}</label>
            <div className={styles.stepperRow}>
              <button className={styles.stepperBtn} onClick={() => setDaysPerWeek(d => Math.max(3, d - 1))}>-</button>
              <span>{daysPerWeek}</span>
              <button className={styles.stepperBtn} onClick={() => setDaysPerWeek(d => Math.min(6, d + 1))}>+</button>
            </div>
          </div>

          <div className={styles.field}>
            <label>Volume semanal atual: {currentWeeklyKm}km</label>
            <div className={styles.stepperRow}>
              <button className={styles.stepperBtn} onClick={() => setCurrentWeeklyKm(k => Math.max(0, k - 5))}>-</button>
              <span>{currentWeeklyKm}km</span>
              <button className={styles.stepperBtn} onClick={() => setCurrentWeeklyKm(k => Math.min(150, k + 5))}>+</button>
            </div>
          </div>

          <div className={styles.field}>
            <label>Treino de força</label>
            <div className={styles.optionsGrid}>
              <button
                className={`${styles.optionCard} ${includeStrength ? styles.optionCardActive : ''}`}
                onClick={() => setIncludeStrength(true)}
              >
                Sim
              </button>
              <button
                className={`${styles.optionCard} ${!includeStrength ? styles.optionCardActive : ''}`}
                onClick={() => setIncludeStrength(false)}
              >
                Não
              </button>
            </div>
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          <button className="btn-primary" style={{ width: '100%' }} onClick={simulate} disabled={loading}>
            {loading ? 'Simulando...' : 'Simular plano'}
          </button>
        </>
      )}

      {result && (
        <div className={styles.resultWrap}>
          <div className="glass-card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginBottom: 8 }}>{raceLabel}</h3>
            <p style={{ marginBottom: 8 }}>
              Pico: <b>{result.assessment.peakWeeklyKm}km/semana</b> · longão até <b>{result.assessment.peakLongRunKm}km</b>
            </p>
            {result.coachNote && <p>{result.coachNote}</p>}
          </div>

          <div className={styles.weeksList}>
            {result.weeks.map(w => (
              <div key={w.weekNumber} className={styles.weekRow}>
                <span>Semana {w.weekNumber} ({w.phase})</span>
                <b>{w.totalKm}km</b>
              </div>
            ))}
          </div>

          <div className={styles.resultActions}>
            <button className="btn-primary" style={{ width: '100%' }} onClick={download}>
              ⬇ Baixar plano (.txt)
            </button>
            <button className="btn-secondary" style={{ width: '100%' }} onClick={() => setResult(null)}>
              Simular outro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
