import { describe, expect, it } from 'vitest';
import { getBiomarkerStatus } from '../health';

describe('getBiomarkerStatus', () => {
  it('treats one-sided low HDL as borderline before it is out of range', () => {
    expect(getBiomarkerStatus('hdl', 80)).toBe('optimal');
    expect(getBiomarkerStatus('hdl', 38)).toBe('borderline');
    expect(getBiomarkerStatus('hdl', 20)).toBe('out_of_range');
  });

  it('keeps a 10% buffer above max-only ranges without inventing a floor of zero', () => {
    expect(getBiomarkerStatus('ldl', 60)).toBe('optimal');
    expect(getBiomarkerStatus('ldl', 105)).toBe('borderline');
    expect(getBiomarkerStatus('ldl', 130)).toBe('out_of_range');
  });
});
