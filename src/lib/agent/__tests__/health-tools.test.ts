import { describe, expect, it } from 'vitest';
import { getHealthScorecard, getRecoverySnapshot } from '../health-tools';
import type { HealthSnapshot } from '../health-snapshot';

describe('getHealthScorecard', () => {
  it('does not invent a composite score from body-composition-only data', () => {
    const snapshot: HealthSnapshot = {
      biomarkers: {},
      bodyComp: { bodyFatPercent: 20 },
      activity: [],
      phenoAge: null,
      chronologicalAge: null,
      activitySource: 'unknown',
    };

    const result = getHealthScorecard(snapshot);

    expect(result.empty).toBe(true);
    expect(result.metrics).toEqual([]);
    expect(result.summary).toContain('needs lab or wearable data');
  });
});

describe('getRecoverySnapshot', () => {
  it('ignores zero placeholders and keeps measured sleep and HRV', () => {
    const snapshot: HealthSnapshot = {
      biomarkers: {},
      bodyComp: {},
      activity: [
        { date: '2026-01-01', hrv: 0, rhr: 0, sleepHours: 8 },
        { date: '2026-01-02', hrv: 60, rhr: 0, sleepHours: 0 },
      ],
      phenoAge: null,
      chronologicalAge: null,
      activitySource: 'whoop',
    };

    const result = getRecoverySnapshot(snapshot);

    expect(result.empty).toBe(false);
    expect(result.metrics.map((metric) => metric.label)).toEqual(['HRV', 'Sleep']);
    expect(result.data).toMatchObject({ averages: { hrv: 60, sleep: 8, rhr: null } });
  });

  it('keeps an explicit zero step count and a recorded 0% recovery in the average', () => {
    const snapshot: HealthSnapshot = {
      biomarkers: {},
      bodyComp: {},
      activity: [
        { date: '2026-01-01', hrv: 0, rhr: 0, sleepHours: 0, steps: 0, recovery: 0 },
        { date: '2026-01-02', hrv: 0, rhr: 0, sleepHours: 0, steps: 8000, recovery: 80 },
      ],
      phenoAge: null,
      chronologicalAge: null,
      activitySource: 'google_fit',
    };

    const result = getRecoverySnapshot(snapshot);

    expect(result.empty).toBe(false);
    expect(result.data).toMatchObject({ averages: { steps: 4000, recovery: 40, hrv: null } });
  });
});
