import { HealthDataStore, type ActivityData } from '@/lib/store/health-data';
import { LifestyleClient } from './LifestyleClient';

function getActivityData(): ActivityData[] {
  return HealthDataStore.getActivity();
}

function calculateAverages(activity: ActivityData[]): {
  avgHrv: number;
  avgRhr: number;
  avgSleep: number;
  avgSleepScore: number;
  avgStrain: number;
} {
  if (activity.length === 0) {
    return { avgHrv: 0, avgRhr: 0, avgSleep: 0, avgSleepScore: 0, avgStrain: 0 };
  }

  const sum = activity.reduce(
    (acc, d) => ({
      hrv: acc.hrv + d.hrv,
      rhr: acc.rhr + d.rhr,
      sleep: acc.sleep + d.sleepHours,
      sleepScore: acc.sleepScore + (d.sleepScore ?? 0),
      strain: acc.strain + (d.strain ?? 0),
    }),
    { hrv: 0, rhr: 0, sleep: 0, sleepScore: 0, strain: 0 }
  );

  const count = activity.length;
  const scoreCount = activity.filter((d) => d.sleepScore !== undefined).length || 1;
  const strainCount = activity.filter((d) => d.strain !== undefined).length || 1;

  return {
    avgHrv: Math.round(sum.hrv / count),
    avgRhr: Math.round(sum.rhr / count),
    avgSleep: Math.round((sum.sleep / count) * 10) / 10,
    avgSleepScore: Math.round(sum.sleepScore / scoreCount),
    avgStrain: Math.round((sum.strain / strainCount) * 10) / 10,
  };
}

export default function LifestylePage(): React.JSX.Element {
  const activityData = getActivityData();
  const averages = calculateAverages(activityData);

  return <LifestyleClient activityData={activityData} averages={averages} />;
}
