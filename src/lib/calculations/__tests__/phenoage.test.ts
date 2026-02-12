import { describe, expect, it } from 'vitest';
import { calculatePhenoAge } from '../phenoage';

describe('calculatePhenoAge', () => {
  it('returns a stable PhenoAge result for a complete biomarker panel', () => {
    const result = calculatePhenoAge(
      {
        albumin: 4.5,
        creatinine: 0.9,
        glucose: 85,
        crp: 0.5,
        lymphocytePercent: 30,
        mcv: 88,
        rdw: 12.5,
        alkalinePhosphatase: 50,
        wbc: 5.5,
      },
      35
    );

    expect(result).not.toBeNull();
    expect(result?.phenoAge).toBe(33.2);
    expect(result?.delta).toBe(-1.8);
  });

  it('derives lymphocytePercent from absolute lymphocytes when needed', () => {
    const result = calculatePhenoAge(
      {
        albumin: 4.5,
        creatinine: 0.9,
        glucose: 85,
        crp: 0.5,
        lymphocytes: 1800,
        mcv: 88,
        rdw: 12.5,
        alkalinePhosphatase: 50,
        wbc: 5.5,
      },
      35
    );

    expect(result).not.toBeNull();
    expect(result?.phenoAge).toBeGreaterThan(0);
  });

  it('returns null when required biomarkers are missing', () => {
    const result = calculatePhenoAge(
      {
        albumin: 4.5,
        creatinine: 0.9,
        glucose: 85,
      },
      35
    );

    expect(result).toBeNull();
  });
});

