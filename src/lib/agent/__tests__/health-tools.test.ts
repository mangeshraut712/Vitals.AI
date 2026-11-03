import { describe, expect, it } from 'vitest';
import { getHealthScorecard } from '../health-tools';
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
