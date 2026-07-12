import { WorkoutType } from './workoutTypes';

export type Workout = {
  id: string;
  plan_id: string;
  week_number: number;
  date: string;
  type: WorkoutType;
  title: string;
  distance_km: number | null;
  duration_min_low: number | null;
  duration_min_high: number | null;
  pace_guidance: string | null;
  ai_summary: string | null;
  completed_at: string | null;
  skipped: boolean;
  linked_strava_activity_id: string | null;
};

export type Plan = {
  id: string;
  strava_athlete_id: string;
  race_distance_km: number;
  race_label: string;
  race_date: string | null;
  start_date: string;
  level: 'iniciante' | 'intermediario' | 'avancado';
  days_per_week: number;
  duration_weeks: number;
  include_strength: boolean;
  current_weekly_km: number;
  status: string;
};
