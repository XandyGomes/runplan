'use client';

import { useState } from 'react';
import styles from './CoachMessage.module.css';

const COACH_NAME = 'Coach RunPlan';
const COACH_ROLE = 'Treinador principal';

export default function CoachMessage({ userName, message }: { userName: string; message: string | null }) {
  const [expanded, setExpanded] = useState(false);

  if (!message) return null;

  const greeting = `E aí${userName ? `, ${userName}` : ''}? `;
  const short = message.length > 90 ? `${message.slice(0, 90)}…` : message;

  return (
    <div className={styles.wrap}>
      <div className={styles.avatar}>{COACH_NAME[0]}</div>
      <div className={styles.body}>
        <div className={styles.name}>{COACH_NAME}</div>
        <div className={styles.role}>{COACH_ROLE}</div>
        <p className={styles.text}>
          {greeting}
          {expanded ? message : short}
        </p>
        {!expanded && message.length > 90 && (
          <button className={styles.more} onClick={() => setExpanded(true)}>
            Ver mais
          </button>
        )}
      </div>
    </div>
  );
}
