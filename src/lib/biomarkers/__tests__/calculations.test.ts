import { describe, expect, it } from 'vitest';
import { calculateDerivedBiomarkers } from '../calculations';

describe('calculateDerivedBiomarkers', () => {
  it('scales percent differentials by WBC units before inflammation ratios', () => {
    const calculated = calculateDerivedBiomarkers({
      wbc: 5.5,
      lymphocytePercent: 30,
      neutrophilPercent: 55,
      monocytePercent: 8,
      platelets: 250,
      hdl: 50,
    });
    const byId = Object.fromEntries(calculated.map((marker) => [marker.id, marker.value]));

    expect(byId.nlr).toBeCloseTo(1.83, 2);
    expect(byId.plr).toBe(152);
    expect(byId.siri).toBeCloseTo(0.81, 2);
    expect(byId.mhr).toBeCloseTo(0.0088, 4);
  });

  it('keeps absolute cell counts in cells per microliter', () => {
    const calculated = calculateDerivedBiomarkers({
      neutrophils: 3025,
      lymphocytes: 1650,
      monocytes: 440,
      platelets: 250,
      hdl: 50,
    });
    const byId = Object.fromEntries(calculated.map((marker) => [marker.id, marker.value]));

    expect(byId.plr).toBe(152);
    expect(byId.siri).toBeCloseTo(0.81, 2);
  });
});
