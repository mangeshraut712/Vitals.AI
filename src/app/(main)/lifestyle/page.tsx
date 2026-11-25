import { averageMeasured } from '@/lib/activity/measured-values';
import { HealthDataStore, type ActivityData } from '@/lib/store/health-data';
import type { WhoopData } from '@/lib/parsers/whoop';
import { LifestyleClient } from './LifestyleClient';

export const dynamic = 'force-dynamic';

async function getActivityData(): Promise<ActivityData[]> {
  return await HealthDataStore.getActivity();
}

async function getWhoopData(): Promise<WhoopData | null> {
  return await HealthDataStore.getWhoopData();
}

function calculateAverages(activity: ActivityData[]): {
  avgHrv: number;
  avgRhr: number;
  avgSleep: number;
  avgSleepScore: number;
  avgStrain: number;
  avgRecovery: number;
} {
  if (activity.length === 0) {
    return { avgHrv: 0, avgRhr: 0, avgSleep: 0, avgSleepScore: 0, avgStrain: 0, avgRecovery: 0 };
  }

  const roundMeasured = (value: number | null, digits = 0): number => {
    if (value === null) return 0;
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
  };

  return {
    avgHrv: roundMeasured(averageMeasured(activity.map((day) => day.hrv))),
    avgRhr: roundMeasured(averageMeasured(activity.map((day) => day.rhr))),
    avgSleep: roundMeasured(averageMeasured(activity.map((day) => day.sleepHours)), 1),
    avgSleepScore: roundMeasured(averageMeasured(activity.map((day) => day.sleepScore))),
    avgStrain: roundMeasured(averageMeasured(activity.map((day) => day.strain)), 1),
    avgRecovery: roundMeasured(averageMeasured(activity.map((day) => day.recovery))),
  };
}

export default async function LifestylePage(): Promise<React.JSX.Element> {
  const activityData = await getActivityData();
  const whoopData = await getWhoopData();
  const averages = calculateAverages(activityData);
  const recentWorkouts = whoopData?.workouts.slice(-10) ?? [];

  return (
    <LifestyleClient
      activityData={activityData}
      averages={averages}
      recentWorkouts={recentWorkouts}
    />
  );
}
