'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import styles from './page.module.css';

type Race = {
  id: string;
  name: string;
  date: string;
  distance: string;
  city: string;
  goalTime: string;
  notes: string;
  kitDate: string;
};

const DISTANCES = ['5km', '10km', '15km', '21km (Meia)', '42km (Maratona)', 'Trail', 'Outro'];

const emptyForm = { name: '', date: '', distance: '10km', city: '', goalTime: '', notes: '', kitDate: '', customDistance: '' };

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const race = new Date(`${dateStr}T00:00:00`);
  return Math.ceil((race.getTime() - today.getTime()) / 86400000);
}

function fmtDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function mapRace(row: any): Race {
  return {
    id: row.id,
    name: row.name,
    date: row.date,
    distance: row.distance || '',
    city: row.city || '',
    goalTime: row.goal_time || '',
    notes: row.notes || '',
    kitDate: row.kit_date || '',
  };
}

function CountdownBadge({ days }: { days: number }) {
  if (days < 0) return <span className={`${styles.badge} ${styles.badgeMuted}`}>Finalizada</span>;
  if (days === 0) return <span className={`${styles.badge} ${styles.badgeHot}`}>🔥 Hoje!</span>;
  if (days <= 7) return <span className={`${styles.badge} ${styles.badgeSoon}`}>⚡ {days}d</span>;
  return <span className={`${styles.badge} ${styles.badgeOk}`}>{days} dias</span>;
}

export default function CorridasPage() {
  const router = useRouter();
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isCustom, setIsCustom] = useState(false);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/races')
      .then(res => {
        if (res.status === 401) {
          router.push('/');
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data?.races) setRaces(data.races.map(mapRace));
        setLoading(false);
      });
  }, [router]);

  const reload = async () => {
    const res = await fetch('/api/races');
    const data = await res.json();
    if (data?.races) setRaces(data.races.map(mapRace));
  };

  const openAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setIsCustom(false);
    setShowForm(true);
  };

  const openEdit = (r: Race) => {
    const isCustomDist = !DISTANCES.includes(r.distance);
    setForm({
      name: r.name,
      date: r.date,
      distance: isCustomDist ? 'Outro' : r.distance,
      city: r.city,
      goalTime: r.goalTime,
      notes: r.notes,
      kitDate: r.kitDate,
      customDistance: isCustomDist ? r.distance : '',
    });
    setIsCustom(isCustomDist);
    setEditId(r.id);
    setShowForm(true);
  };

  const submit = async () => {
    if (!form.name || !form.date) return;
    setSaving(true);
    const distance = isCustom ? form.customDistance || form.distance : form.distance;
    const payload = {
      name: form.name,
      date: form.date,
      distance,
      city: form.city,
      goalTime: form.goalTime,
      notes: form.notes,
      kitDate: form.kitDate,
    };
    try {
      if (editId) {
        await fetch('/api/races', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, ...payload }),
        });
      } else {
        await fetch('/api/races', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      await reload();
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta corrida?')) return;
    setRaces(prev => prev.filter(r => r.id !== id));
    await fetch(`/api/races?id=${id}`, { method: 'DELETE' });
  };

  const generatePlan = (r: Race) => {
    const params = new URLSearchParams({ raceLabel: r.name, distance: r.distance, date: r.date });
    router.push(`/onboarding?${params.toString()}`);
  };

  const upcoming = races.filter(r => daysUntil(r.date) >= 0).sort((a, b) => a.date.localeCompare(b.date));
  const past = races.filter(r => daysUntil(r.date) < 0).sort((a, b) => b.date.localeCompare(a.date));
  const list = tab === 'upcoming' ? upcoming : past;
  const nextRace = upcoming[0];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Seu calendário</p>
          <h1>Minhas corridas</h1>
        </div>
        <button className={`${styles.addBtn} pressable`} onClick={openAdd} aria-label="Adicionar corrida">
          +
        </button>
      </div>

      {loading ? (
        <p>Carregando suas corridas...</p>
      ) : (
        <>
          {nextRace && (
            <div className={styles.heroCard}>
              <span className={styles.heroLabel}>🏁 Próxima corrida</span>
              <div className={styles.heroBody}>
                <div className={styles.heroInfo}>
                  <h2>{nextRace.name}</h2>
                  <p className={styles.heroDate}>{fmtDate(nextRace.date)}</p>
                  <div className={styles.chips}>
                    <span className={`${styles.chip} ${styles.chipPrimary}`}>{nextRace.distance}</span>
                    {nextRace.city && <span className={styles.chip}>📍 {nextRace.city}</span>}
                    {nextRace.goalTime && <span className={`${styles.chip} ${styles.chipGoal}`}>🎯 {nextRace.goalTime}</span>}
                  </div>
                </div>
                <div className={styles.heroCount}>
                  <div className={styles.heroCountNum}>{daysUntil(nextRace.date)}</div>
                  <div className={styles.heroCountLabel}>dias</div>
                </div>
              </div>

              {nextRace.kitDate && (
                <div className={styles.kitRow}>
                  <span>🎁</span>
                  <span>
                    Retirada do kit:{' '}
                    <b>
                      {daysUntil(nextRace.kitDate) === 0
                        ? 'HOJE!'
                        : daysUntil(nextRace.kitDate) === 1
                          ? 'amanhã'
                          : fmtDate(nextRace.kitDate)}
                    </b>
                  </span>
                </div>
              )}

              <button className={`${styles.heroPlanBtn} pressable`} onClick={() => generatePlan(nextRace)}>
                📋 Gerar plano de treino para esta corrida ›
              </button>
            </div>
          )}

          <div className={styles.tabs}>
            {(['upcoming', 'past'] as const).map(t => (
              <button
                key={t}
                className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
                onClick={() => setTab(t)}
              >
                {t === 'upcoming' ? `Próximas (${upcoming.length})` : `Passadas (${past.length})`}
              </button>
            ))}
          </div>

          {list.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🏁</div>
              <h3>{tab === 'upcoming' ? 'Nenhuma corrida agendada' : 'Nenhuma corrida passada'}</h3>
              <p>{tab === 'upcoming' ? 'Adicione suas provas e nunca perca uma data ou retirada de kit.' : 'Suas provas concluídas aparecerão aqui.'}</p>
              {tab === 'upcoming' && (
                <button className="btn-primary" onClick={openAdd}>
                  + Adicionar corrida
                </button>
              )}
            </div>
          ) : (
            <div className={styles.list}>
              {list.map(r => {
                const days = daysUntil(r.date);
                return (
                  <div key={r.id} className={styles.raceCard}>
                    <div className={styles.raceTop}>
                      <div className={styles.raceTitle}>
                        <div className={styles.raceTitleRow}>
                          <h3>{r.name}</h3>
                          <CountdownBadge days={days} />
                        </div>
                        <p className={styles.raceDate}>{fmtDate(r.date)}</p>
                      </div>
                      <div className={styles.raceActions}>
                        <button className={`${styles.iconBtn} pressable`} onClick={() => openEdit(r)} aria-label="Editar">✏️</button>
                        <button className={`${styles.iconBtn} ${styles.iconBtnDanger} pressable`} onClick={() => remove(r.id)} aria-label="Excluir">🗑️</button>
                      </div>
                    </div>
                    <div className={styles.chips}>
                      <span className={`${styles.chip} ${styles.chipPrimary}`}>{r.distance}</span>
                      {r.city && <span className={styles.chip}>📍 {r.city}</span>}
                      {r.goalTime && <span className={`${styles.chip} ${styles.chipGoal}`}>🎯 {r.goalTime}</span>}
                      {r.kitDate && (
                        <span className={`${styles.chip} ${daysUntil(r.kitDate) === 0 ? styles.chipKitHot : ''}`}>
                          🎁 Kit: {daysUntil(r.kitDate) === 0 ? 'HOJE!' : daysUntil(r.kitDate) === 1 ? 'Amanhã' : fmtDate(r.kitDate)}
                        </span>
                      )}
                    </div>
                    {r.notes && <p className={styles.raceNotes}>{r.notes}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {showForm && (
        <div className={styles.overlay} onClick={() => setShowForm(false)}>
          <div className={styles.sheet} onClick={e => e.stopPropagation()}>
            <div className={styles.sheetGrabber} />
            <h2 className={styles.sheetTitle}>{editId ? '✏️ Editar corrida' : '🏁 Nova corrida'}</h2>

            <div className={styles.formFields}>
              <Field label="Nome da corrida *" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="Ex: Meia Maratona de Franca" />
              <Field label="Data *" type="date" value={form.date} onChange={v => setForm(p => ({ ...p, date: v }))} />
              <Field label="Data da retirada do kit" type="date" value={form.kitDate} onChange={v => setForm(p => ({ ...p, kitDate: v }))} />
              <Field label="Cidade" value={form.city} onChange={v => setForm(p => ({ ...p, city: v }))} placeholder="Ex: Franca - SP" />
              <Field label="Tempo meta" value={form.goalTime} onChange={v => setForm(p => ({ ...p, goalTime: v }))} placeholder="Ex: 02:30:00" />
              <Field label="Anotações" value={form.notes} onChange={v => setForm(p => ({ ...p, notes: v }))} placeholder="Lembrete, largada, documentos..." />

              <div>
                <label className={styles.fieldLabel}>Distância</label>
                <div className={styles.distGrid}>
                  {DISTANCES.map(d => (
                    <button
                      key={d}
                      className={`${styles.distBtn} ${form.distance === d ? styles.distBtnActive : ''}`}
                      onClick={() => {
                        setForm(p => ({ ...p, distance: d }));
                        setIsCustom(d === 'Outro');
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                {isCustom && (
                  <input
                    className={styles.input}
                    style={{ marginTop: 8 }}
                    value={form.customDistance}
                    onChange={e => setForm(p => ({ ...p, customDistance: e.target.value }))}
                    placeholder="Ex: 6km, 8km, 12km..."
                  />
                )}
              </div>

              <button className="btn-primary" onClick={submit} disabled={!form.name || !form.date || saving} style={{ width: '100%', marginTop: 4 }}>
                {saving ? 'Salvando...' : editId ? 'Salvar alterações' : '+ Adicionar corrida'}
              </button>
              <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className={styles.fieldLabel}>{label}</label>
      <input className={styles.input} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
