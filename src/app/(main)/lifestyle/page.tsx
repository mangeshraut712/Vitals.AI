import { HealthDataStore, type ActivityData } from '@/lib/store/health-data';
import type { WhoopData } from '@/lib/parsers/whoop';
import { LifestyleClient } from './LifestyleClient';

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

  const sum = activity.reduce(
    (acc, d) => ({
      hrv: acc.hrv + d.hrv,
      rhr: acc.rhr + d.rhr,
      sleep: acc.sleep + d.sleepHours,
      sleepScore: acc.sleepScore + (d.sleepScore ?? 0),
      strain: acc.strain + (d.strain ?? 0),
      recovery: acc.recovery + (d.recovery ?? 0),
    }),
    { hrv: 0, rhr: 0, sleep: 0, sleepScore: 0, strain: 0, recovery: 0 }
  );

  const count = activity.length;
  const scoreCount = activity.filter((d) => d.sleepScore !== undefined).length || 1;
  const strainCount = activity.filter((d) => d.strain !== undefined).length || 1;
  const recoveryCount = activity.filter((d) => d.recovery !== undefined).length || 1;

  return {
    avgHrv: Math.round(sum.hrv / count),
    avgRhr: Math.round(sum.rhr / count),
    avgSleep: Math.round((sum.sleep / count) * 10) / 10,
    avgSleepScore: Math.round(sum.sleepScore / scoreCount),
    avgStrain: Math.round((sum.strain / strainCount) * 10) / 10,
    avgRecovery: Math.round(sum.recovery / recoveryCount),
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
