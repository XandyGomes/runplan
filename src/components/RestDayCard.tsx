import styles from './RestDayCard.module.css';

export default function RestDayCard({ userName }: { userName: string }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.icon}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />
        </svg>
      </div>
      <h2 className={styles.title}>Descanse{userName ? `, ${userName}` : ''}</h2>
      <p className={styles.subtitle}>A recuperação alimenta o sucesso, então aproveite seu dia de descanso!</p>
    </div>
  );
}
