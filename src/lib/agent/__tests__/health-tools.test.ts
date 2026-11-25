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
        { date: '2026-01-01', hrv: 0, rhr: 0, sleepHours: 8, recovery: 0, steps: 0 },
        { date: '2026-01-02', hrv: 60, rhr: 0, sleepHours: 0, recovery: 0, steps: 0 },
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
});
