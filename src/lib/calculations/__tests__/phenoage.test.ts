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
    expect(result?.phenoAge).toBe(24);
    expect(result?.delta).toBe(-11);
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

  it('returns null for non-finite age or biomarker values', () => {
    expect(calculatePhenoAge({
      albumin: 4.5,
      creatinine: 0.9,
      glucose: 85,
      crp: 0.5,
      lymphocytePercent: 30,
      mcv: 88,
      rdw: 12.5,
      alkalinePhosphatase: 50,
      wbc: 5.5,
    }, Number.NaN)).toBeNull();

    expect(calculatePhenoAge({
      albumin: 4.5,
      creatinine: 0.9,
      glucose: Number.POSITIVE_INFINITY,
      crp: 0.5,
      lymphocytePercent: 30,
      mcv: 88,
      rdw: 12.5,
      alkalinePhosphatase: 50,
      wbc: 5.5,
    }, 35)).toBeNull();
  });

  it('does not throw when CRP is zero', () => {
    const result = calculatePhenoAge({
      albumin: 4.5,
      creatinine: 0.9,
      glucose: 85,
      crp: 0,
      lymphocytePercent: 30,
      mcv: 88,
      rdw: 12.5,
      alkalinePhosphatase: 50,
      wbc: 5.5,
    }, 35);

    expect(result?.phenoAge).toBeGreaterThan(0);
  });
});

