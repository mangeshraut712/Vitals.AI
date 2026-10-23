import { describe, expect, it } from 'vitest';
import {
  calculateCardiovascularRisk,
  calculateMetabolicHealthScore,
  calculateTrend,
} from '../advanced-analytics';

describe('calculateTrend', () => {
  it('stays finite when every sample shares a timestamp', () => {
    const timestamp = '2026-01-01T00:00:00.000Z';
    const trend = calculateTrend([
      { timestamp, value: 90 },
      { timestamp, value: 110 },
    ]);

    expect(trend.direction).toBe('stable');
    expect(Number.isFinite(trend.slope)).toBe(true);
    expect(Number.isFinite(trend.r2)).toBe(true);
    expect(Number.isFinite(trend.confidence)).toBe(true);
  });

  it('treats a flat series as stable with a defined fit', () => {
    const trend = calculateTrend([
      { timestamp: '2026-01-01T00:00:00.000Z', value: 90 },
      { timestamp: '2026-01-02T00:00:00.000Z', value: 90 },
      { timestamp: '2026-01-03T00:00:00.000Z', value: 90 },
    ]);

    expect(trend.direction).toBe('stable');
    expect(trend.slope).toBe(0);
    expect(trend.r2).toBe(1);
  });

  it('detects an increasing series', () => {
    const trend = calculateTrend([
      { timestamp: '2026-01-01T00:00:00.000Z', value: 80 },
      { timestamp: '2026-01-02T00:00:00.000Z', value: 90 },
      { timestamp: '2026-01-03T00:00:00.000Z', value: 100 },
    ]);

    expect(trend.direction).toBe('increasing');
    expect(trend.slope).toBeGreaterThan(0);
  });
});

describe('risk scores', () => {
  it('does not treat high HDL as cardiovascular risk', () => {
    const low = calculateCardiovascularRisk({ hdl: 30 });
    const high = calculateCardiovascularRisk({ hdl: 110 });

    expect(low.score).toBeGreaterThan(0);
    expect(high.score).toBe(0);
  });

  it('does not penalize HDL above the optimal ceiling', () => {
    const high = calculateMetabolicHealthScore({ hdl: 110 });
    const low = calculateMetabolicHealthScore({ hdl: 20 });

    expect(high).toBe(100);
    expect(low).toBeLessThan(100);
  });
});
