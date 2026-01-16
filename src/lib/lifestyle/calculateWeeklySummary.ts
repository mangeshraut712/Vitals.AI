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

  // Calculate Recovery average (using sleep score as proxy)
  const recoveryValues = recentData
    .map((d) => d.sleepScore)
    .filter((v): v is number => v !== undefined && v > 0);
  const recovery = recoveryValues.length > 0
    ? Math.round(recoveryValues.reduce((sum, v) => sum + v, 0) / recoveryValues.length)
    : null;

  // Calculate Sleep Consistency
  // Consistency = % of nights where sleep hours are within 30min (0.5 hrs) of average
  const sleepHours = recentData
    .map((d) => d.sleepHours)
    .filter((v) => v > 0);

  let sleepConsistency: number | null = null;
  if (sleepHours.length > 1) {
    const avgSleep = sleepHours.reduce((sum, v) => sum + v, 0) / sleepHours.length;
    const tolerance = 0.5; // 30 minutes in hours

    const consistentNights = sleepHours.filter(
      (hours) => Math.abs(hours - avgSleep) <= tolerance
    ).length;

    sleepConsistency = Math.round((consistentNights / sleepHours.length) * 100);
  }

  return {
    sleepConsistency,
    hrv,
    strain,
    recovery,
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
