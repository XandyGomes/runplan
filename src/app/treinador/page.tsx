'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import styles from './page.module.css';

type Message = { role: 'user' | 'aura'; content: string; ts: Date };

const SUGGESTIONS = [
  'Como está minha evolução?',
  'Meu plano está adequado?',
  'Dicas pra minha próxima prova',
  'Como evitar lesões?',
];

const INTRO: Message = {
  role: 'aura',
  content:
    'Oi! 👋 Sou a **Aura**, sua treinadora de corrida aqui no RunPlan.\n\nEu enxergo seu histórico do Strava, seu plano de treino ativo e suas próximas provas. Posso te ajudar com:\n• Análise da sua evolução e ritmo\n• Ajustes e dúvidas sobre o plano\n• Estratégia de prova e retirada de kit\n• Prevenção de lesões e recuperação\n\nO que você quer saber?',
  ts: new Date(),
};

function renderContent(text: string) {
  return text.split('\n').map((line, i) => {
    const html = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return <p key={i} className={styles.msgLine} dangerouslySetInnerHTML={{ __html: html || '&nbsp;' }} />;
  });
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function TreinadorPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([INTRO]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text: string) => {
    const msg = text.trim();
    if (!msg || loading) return;
    setInput('');
    const userMsg: Message = { role: 'user', content: msg, ts: new Date() };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);
    try {
      const res = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'aura', content: data.reply || 'Desculpe, tente novamente.', ts: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { role: 'aura', content: 'Ops, problema de conexão. Tente novamente!', ts: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.avatar}>
          🤖
          <span className={styles.online} />
        </div>
        <div className={styles.headerText}>
          <h1>Aura · Treinadora IA</h1>
          <p className={styles.status}>● Online · histórico e plano carregados</p>
        </div>
        <button className={`${styles.newPlanBtn} pressable`} onClick={() => router.push('/onboarding')}>
          + Plano
        </button>
      </div>

      <div className={styles.messages}>
        {messages.map((m, i) => (
          <div key={i} className={`${styles.msgRow} ${m.role === 'user' ? styles.msgRowUser : ''} animate-fade-in-fast`}>
            {m.role === 'aura' && <span className={styles.msgAuthor}>Aura</span>}
            <div className={`${styles.bubble} ${m.role === 'user' ? styles.bubbleUser : styles.bubbleAura}`}>
              {renderContent(m.content)}
            </div>
            <span className={styles.msgTime}>{fmtTime(m.ts)}</span>
          </div>
        ))}

        {loading && (
          <div className={styles.msgRow}>
            <span className={styles.msgAuthor}>Aura</span>
            <div className={`${styles.bubble} ${styles.bubbleAura} ${styles.typing}`}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputBar}>
        {messages.length === 1 && (
          <div className={styles.suggestions}>
            {SUGGESTIONS.map(s => (
              <button key={s} className={styles.suggestion} onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
        <div className={styles.inputRow}>
          <textarea
            className={styles.textarea}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Pergunte à Aura..."
            rows={1}
          />
          <button
            className={`${styles.sendBtn} ${input.trim() ? styles.sendBtnActive : ''}`}
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            aria-label="Enviar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
