import { describe, expect, it } from 'vitest';
import { selectTopMarkers } from '../selectTopMarkers';

describe('selectTopMarkers', () => {
  it('keeps ApoB and HbA1c and ranks camelCase longevity markers ahead of deprioritized ones', () => {
    const markers = selectTopMarkers({
      apoB: 120,
      hba1c: 5.0,
      vitaminD: 20,
      glucose: 90,
      alkalinePhosphatase: 220,
      mcv: 70,
    });

    expect(markers.map((marker) => marker.name).slice(0, 2)).toEqual(['ApoB', 'HbA1c']);
    expect(markers.map((marker) => marker.name)).toContain('Vitamin D (25-OH)');
    const vitaminIndex = markers.findIndex((marker) => marker.name.startsWith('Vitamin D'));
    const alkalineIndex = markers.findIndex((marker) => marker.name === 'Alkaline Phosphatase');
    expect(vitaminIndex).toBeGreaterThanOrEqual(0);
    expect(alkalineIndex === -1 || vitaminIndex < alkalineIndex).toBe(true);
  });
});
