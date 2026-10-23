import { describe, expect, it } from 'vitest';
import { calculateHealthScore } from '../health-score';

describe('calculateHealthScore', () => {
  it('scores lab-normal rows as normal instead of optimal', () => {
    const result = calculateHealthScore(
      {
        all: [
          { name: 'Glucose', value: 90, unit: 'mg/dL', status: 'normal' },
          { name: 'LDL', value: 160, unit: 'mg/dL', status: 'high' },
        ],
      },
      null,
      []
    );

    expect(result.breakdown.optimalCount).toBe(0);
    expect(result.breakdown.normalCount).toBe(1);
    expect(result.breakdown.outOfRangeCount).toBe(1);
    expect(result.breakdown.biomarkerScore).toBe(30);
    expect(result.score).toBe(40);
  });
});
