import type { ActivityData } from '@/lib/store/health-data';
import type { WeeklySummary } from '@/components/dashboard/WeeklyLifestyleCard';

/**
 * Calculate weekly lifestyle summary from activity data
 *
 * Calculates:
 * - Sleep Consistency: % of nights within 30min of average bedtime
 * - HRV: 7-day average
 * - Strain: 7-day average
 * - Recovery: 7-day average of sleep score (Whoop uses sleep score as recovery proxy)
 *
 * @param activityData - Array of daily activity records
 * @returns WeeklySummary object or null if no data
 */
export function calculateWeeklySummary(
  activityData: ActivityData[]
): WeeklySummary | null {
  if (!activityData || activityData.length === 0) {
    return null;
  }

  // Get last 7 days of data (or whatever is available)
  const recentData = activityData.slice(-7);

  // Calculate HRV average
  const hrvValues = recentData
    .map((d) => d.hrv)
    .filter((v) => v > 0);
  const hrv = hrvValues.length > 0
    ? Math.round(hrvValues.reduce((sum, v) => sum + v, 0) / hrvValues.length)
    : null;

  // Calculate Strain average
  const strainValues = recentData
    .map((d) => d.strain)
    .filter((v): v is number => v !== undefined && v > 0);
  const strain = strainValues.length > 0
    ? strainValues.reduce((sum, v) => sum + v, 0) / strainValues.length
    : null;

  // Calculate Recovery average (prefer actual recovery field, fallback to sleep score)
  const recoveryValues = recentData
    .map((d) => d.recovery ?? d.sleepScore) // Use recovery if available, else sleepScore
    .filter((v): v is number => v !== undefined && v > 0);
  const recovery = recoveryValues.length > 0
    ? Math.round(recoveryValues.reduce((sum, v) => sum + v, 0) / recoveryValues.length)
    : null;

  // Calculate Steps average
  const stepsValues = recentData
    .map((d) => d.steps)
    .filter((v): v is number => v !== undefined && v > 0);
  const steps = stepsValues.length > 0
    ? Math.round(stepsValues.reduce((sum, v) => sum + v, 0) / stepsValues.length)
    : null;

  // Calculate Sleep Hours average
  const sleepHoursValues = recentData
    .map((d) => d.sleepHours)
    .filter((v) => v > 0);

  let avgSleepHours: number | null = null;

  if (sleepHoursValues.length > 0) {
    avgSleepHours = Math.round((sleepHoursValues.reduce((sum, v) => sum + v, 0) / sleepHoursValues.length) * 10) / 10;
  }

  // Calculate Sleep Consistency
  // Prefer actual Whoop sleep consistency data if available
  const sleepConsistencyValues = recentData
    .map((d) => d.sleepConsistency)
    .filter((v): v is number => v !== undefined && v > 0);

  let sleepConsistency: number | null = null;

  if (sleepConsistencyValues.length > 0) {
    // Use Whoop's actual sleep consistency metric (average of recent days)
    sleepConsistency = Math.round(
      sleepConsistencyValues.reduce((sum, v) => sum + v, 0) / sleepConsistencyValues.length
    );
  } else if (sleepHoursValues.length > 1) {
    // Fallback: calculate consistency from sleep duration variance
    const avgSleep = sleepHoursValues.reduce((sum, v) => sum + v, 0) / sleepHoursValues.length;
    const tolerance = 0.5; // 30 minutes in hours

    const consistentNights = sleepHoursValues.filter(
      (hours) => Math.abs(hours - avgSleep) <= tolerance
    ).length;

    sleepConsistency = Math.round((consistentNights / sleepHoursValues.length) * 100);
  }

  return {
    sleepConsistency,
    sleepHours: avgSleepHours,
    hrv,
    strain,
    recovery,
    steps,
  };
}

/**
 * Get a more detailed sleep consistency calculation
 * This considers bedtime variance if we had that data
 * For now, we use sleep duration variance as a proxy
 */
export function getSleepConsistencyDetails(activityData: ActivityData[]): {
  consistency: number | null;
  avgSleepHours: number | null;
  variance: number | null;
} {
  const recentData = activityData.slice(-7);
  const sleepHours = recentData
    .map((d) => d.sleepHours)
    .filter((v) => v > 0);

  if (sleepHours.length < 2) {
    return { consistency: null, avgSleepHours: null, variance: null };
  }

  const avgSleepHours = sleepHours.reduce((sum, v) => sum + v, 0) / sleepHours.length;

  // Calculate variance
  const squaredDiffs = sleepHours.map((v) => Math.pow(v - avgSleepHours, 2));
  const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / sleepHours.length;

  // Consistency based on standard deviation
  // Low variance = high consistency
  const stdDev = Math.sqrt(variance);
  const tolerance = 0.5; // 30 minutes

  const consistentNights = sleepHours.filter(
    (hours) => Math.abs(hours - avgSleepHours) <= tolerance
  ).length;

  const consistency = Math.round((consistentNights / sleepHours.length) * 100);

  return {
    consistency,
    avgSleepHours: Math.round(avgSleepHours * 10) / 10,
    variance: Math.round(stdDev * 100) / 100,
  };
}

export default calculateWeeklySummary;
