import { describe, expect, it } from 'vitest';
import { averageMeasured, averageRecorded } from '../measured-values';

describe('wearable averages', () => {
  it('drops placeholder zeros for HRV and keeps an explicit zero step count', () => {
    expect(averageMeasured([0, 60, undefined])).toBe(60);
    expect(averageRecorded([0, 8000, undefined])).toBe(4000);
    expect(averageRecorded([undefined, undefined])).toBeNull();
    expect(averageRecorded([0, 0])).toBe(0);
  });
});
