import { describe, expect, it } from 'vitest';
import { mapHealthToBodyState } from '../mapper';

describe('mapHealthToBodyState', () => {
  it('does not treat missing wearable zeros as fatigue', () => {
    const missing = mapHealthToBodyState({
      biomarkers: {},
      bodyComp: {},
      activity: [{ date: '2026-01-01', hrv: 0, rhr: 0, sleepHours: 0 }],
    });
    const empty = mapHealthToBodyState({
      biomarkers: {},
      bodyComp: {},
      activity: [],
    });

    expect(missing.posture).toBe(empty.posture);
    expect(missing.posture).not.toBe('fatigued');
  });
});
