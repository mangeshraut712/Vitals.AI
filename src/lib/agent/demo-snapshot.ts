import type { HealthSnapshot } from '@/lib/agent/health-snapshot';

/**
 * Public sample panel for GitHub Pages and CI. Not a real person.
 */
export const DEMO_HEALTH_SNAPSHOT: HealthSnapshot = {
  chronologicalAge: 38,
  phenoAge: { phenoAge: 35.4, delta: -2.6 },
  activitySource: 'whoop',
  biomarkers: {
    albumin: 4.6,
    creatinine: 0.9,
    glucose: 86,
    crp: 0.7,
    lymphocytePercent: 29,
    mcv: 89,
    rdw: 12.4,
    alkalinePhosphatase: 52,
    wbc: 5.2,
    ldl: 92,
    hdl: 58,
    triglycerides: 78,
    hba1c: 5.1,
    vitaminD: 42,
  },
  bodyComp: {
    bodyFatPercent: 16.4,
    leanMass: 142,
    visceralFat: 0.8,
  },
  activity: [
    { date: '2026-08-30', hrv: 54, rhr: 56, sleepHours: 7.1, recovery: 72, steps: 8400 },
    { date: '2026-08-31', hrv: 61, rhr: 54, sleepHours: 7.8, recovery: 81, steps: 10200 },
    { date: '2026-09-01', hrv: 48, rhr: 58, sleepHours: 6.4, recovery: 61, steps: 6100 },
    { date: '2026-09-02', hrv: 57, rhr: 55, sleepHours: 7.4, recovery: 76, steps: 9800 },
    { date: '2026-09-03', hrv: 63, rhr: 53, sleepHours: 8.0, recovery: 84, steps: 11100 },
    { date: '2026-09-04', hrv: 59, rhr: 54, sleepHours: 7.2, recovery: 78, steps: 9400 },
    { date: '2026-09-05', hrv: 52, rhr: 57, sleepHours: 6.8, recovery: 68, steps: 7200 },
  ],
};

export const EMPTY_HEALTH_SNAPSHOT: HealthSnapshot = {
  biomarkers: {},
  bodyComp: {},
  activity: [],
  phenoAge: null,
  chronologicalAge: null,
  activitySource: 'unknown',
};
