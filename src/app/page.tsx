import { cookies } from 'next/headers';
import HomeClient from './HomeClient';
import BottomNav from '@/components/BottomNav';
import styles from './page.module.css';

export default async function Home() {
  const cookieStore = await cookies();
  const athleteId = cookieStore.get('strava_athlete_id')?.value;

  if (!athleteId) {
    return (
      <div className={styles.landing}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="RunPlan" className={styles.landingLogo} />
        <h1>RunPlan</h1>
        <p>Planos de treino de corrida personalizados, direto do seu histórico no Strava.</p>
        <a href="/api/auth/strava/login" className="btn-primary">
          Conectar com o Strava
        </a>
      </div>
    );
  }

  return (
    <>
      <HomeClient userName={cookieStore.get('user_name')?.value || ''} userPhoto={cookieStore.get('user_photo')?.value || ''} />
      <BottomNav />
    </>
  );
}
