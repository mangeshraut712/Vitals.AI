/**
 * HRV, resting heart rate, and sleep hours use 0 when the parser has no reading.
 * Zero is not a measurement for those fields.
 */
export function averageMeasured(values: Array<number | null | undefined>): number | null {
  return averageFinite(values, (value) => value > 0);
}

/**
 * Steps, recovery, strain, and sleep score keep an explicit 0.
 * Undefined and blank cells stay missing.
 */
export function averageRecorded(values: Array<number | null | undefined>): number | null {
  return averageFinite(values, (value) => value >= 0);
}

function averageFinite(
  values: Array<number | null | undefined>,
  accept: (value: number) => boolean
): number | null {
  const present = values.filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value) && accept(value)
  );
  if (present.length === 0) return null;
  return present.reduce((sum, value) => sum + value, 0) / present.length;
}
