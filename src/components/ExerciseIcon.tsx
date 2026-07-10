import type { ReactElement } from 'react';
import { ExerciseIconKey } from '@/lib/strengthExercises';

const shared = {
  width: 32,
  height: 32,
  viewBox: '0 0 48 48',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const ICONS: Record<ExerciseIconKey, ReactElement> = {
  squat: (
    <svg {...shared}>
      <circle cx="24" cy="9" r="4" fill="currentColor" stroke="none" />
      <path d="M24 13 L22 26" />
      <path d="M22 26 L15 32 M22 26 L29 32" />
      <path d="M15 32 L13 42 M29 32 L31 42" />
      <path d="M23 16 L13 20 M23 16 L33 20" />
    </svg>
  ),
  lunge: (
    <svg {...shared}>
      <circle cx="21" cy="9" r="4" fill="currentColor" stroke="none" />
      <path d="M21 13 L23 24" />
      <path d="M23 24 L14 30 L11 40" />
      <path d="M23 24 L33 27 L38 20" />
      <path d="M22 16 L14 14 M22 16 L30 12" />
    </svg>
  ),
  plank: (
    <svg {...shared}>
      <circle cx="9" cy="24" r="4" fill="currentColor" stroke="none" />
      <path d="M13 24 L38 24" />
      <path d="M17 24 L14 34" />
      <path d="M38 24 L38 34" />
      <path d="M20 24 L18 16" />
    </svg>
  ),
  sidePlank: (
    <svg {...shared}>
      <circle cx="10" cy="20" r="4" fill="currentColor" stroke="none" />
      <path d="M14 21 L37 27" />
      <path d="M18 21.5 L16 33" />
      <path d="M37 27 L39 36" />
      <path d="M22 22.5 L24 10" />
    </svg>
  ),
  bridge: (
    <svg {...shared}>
      <circle cx="10" cy="30" r="4" fill="currentColor" stroke="none" />
      <path d="M14 30 L26 20 L34 30" />
      <path d="M34 30 L34 40" />
      <path d="M26 20 L26 30" />
    </svg>
  ),
  pushup: (
    <svg {...shared}>
      <circle cx="9" cy="26" r="4" fill="currentColor" stroke="none" />
      <path d="M13 26 L38 20" />
      <path d="M18 25.5 L14 34" />
      <path d="M38 20 L36 32" />
      <path d="M20 25.8 L20 16" />
    </svg>
  ),
  calf: (
    <svg {...shared}>
      <circle cx="24" cy="8" r="4" fill="currentColor" stroke="none" />
      <path d="M24 12 L23 30" />
      <path d="M23 30 L19 40" />
      <path d="M23 30 L28 40" />
      <path d="M19 40 L24 38" />
      <path d="M24 15 L16 20 M24 15 L32 18" />
    </svg>
  ),
  core: (
    <svg {...shared}>
      <circle cx="10" cy="24" r="4" fill="currentColor" stroke="none" />
      <path d="M14 24 L28 24" />
      <path d="M28 24 L38 14" />
      <path d="M28 24 L38 32" />
      <path d="M18 24 L14 34" />
    </svg>
  ),
  stretch: (
    <svg {...shared}>
      <circle cx="20" cy="8" r="4" fill="currentColor" stroke="none" />
      <path d="M20 12 L21 28" />
      <path d="M21 28 L15 40" />
      <path d="M21 28 L30 24 L30 12" />
      <path d="M21 16 L13 12" />
    </svg>
  ),
  mobility: (
    <svg {...shared}>
      <circle cx="24" cy="24" r="4" fill="currentColor" stroke="none" />
      <path d="M24 28 L24 34" />
      <path d="M13 20 A 12 12 0 0 1 30 11" />
      <path d="M35 28 A 12 12 0 0 1 18 37" />
      <path d="M27 8 L30 11 L26 13" />
      <path d="M21 40 L18 37 L22 35" />
    </svg>
  ),
};

export default function ExerciseIcon({ icon }: { icon: ExerciseIconKey }) {
  return ICONS[icon];
}
