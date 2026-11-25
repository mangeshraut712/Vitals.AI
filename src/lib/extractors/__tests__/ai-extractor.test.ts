import { describe, expect, it } from 'vitest';
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
    expect(extracted.monocytes).toBe(0.42);
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
    expect(extracted.lymphocytes).toBe(1.8);
  });
});
