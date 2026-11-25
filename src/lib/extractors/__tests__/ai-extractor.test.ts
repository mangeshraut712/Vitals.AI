import { describe, expect, it } from 'vitest';
import { calculatePhenoAge } from '@/lib/calculations/phenoage';
import { mapAiBiomarkers } from '../ai-extractor';

describe('mapAiBiomarkers', () => {
  it('keeps absolute lymphocyte and monocyte counts that are not percents', () => {
    const extracted = mapAiBiomarkers([
      { name: 'Lymphocytes', value: 1800, unit: 'cells/uL' },
      { name: 'Monocytes', value: 0.42, unit: 'x10^3/uL' },
      { name: 'Glucose', value: 90, unit: 'mg/dL' },
    ]);

    expect(extracted.lymphocytes).toBe(1800);
    expect(extracted.lymphocytePercent).toBeUndefined();
    expect(extracted.monocytes).toBe(420);
    expect(extracted.all?.find((marker) => marker.name === 'Monocytes')).toMatchObject({
      value: 420,
      unit: 'cells/uL',
    });
    expect(extracted.monocytePercent).toBeUndefined();
    expect(extracted.glucose).toBe(90);
  });

  it('stores percent differentials on the percent keys, including bare neutrophil names', () => {
    const extracted = mapAiBiomarkers([
      { name: 'Lymphocytes', value: 32, unit: '%' },
      { name: 'Neutrophils', value: 55, unit: '%' },
      { name: 'Absolute Lymphocytes', value: 1.8, unit: 'x10^3/uL' },
    ]);

    expect(extracted.lymphocytePercent).toBe(32);
    expect(extracted.neutrophilPercent).toBe(55);
    expect(extracted.neutrophils).toBeUndefined();
    expect(extracted.lymphocytes).toBe(1800);

    const panel = {
      albumin: 4.5,
      creatinine: 0.9,
      glucose: 85,
      crp: 0.5,
      mcv: 88,
      rdw: 12.5,
      alkalinePhosphatase: 50,
      wbc: 5.5,
    };
    expect(calculatePhenoAge({ ...panel, lymphocytes: extracted.lymphocytes }, 35)).toEqual(
      calculatePhenoAge({ ...panel, lymphocytes: 1800 }, 35)
    );
  });

  it('scales K/μL when the micro sign is Greek mu', () => {
    const extracted = mapAiBiomarkers([{ name: 'Lymphocytes', value: 1.8, unit: 'K/μL' }]);

    expect(extracted.lymphocytes).toBe(1800);
    expect(extracted.all?.[0]).toMatchObject({ value: 1800, unit: 'cells/uL' });
  });
});
