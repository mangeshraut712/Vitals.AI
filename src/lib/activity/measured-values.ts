/**
 * Wearable parsers fill missing HRV, resting heart rate, and sleep with 0.
 * Zero is not a measured value for those metrics.
 */
export function averageMeasured(values: Array<number | null | undefined>): number | null {
  const present = values.filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0
  );
  if (present.length === 0) return null;
  return present.reduce((sum, value) => sum + value, 0) / present.length;
}
