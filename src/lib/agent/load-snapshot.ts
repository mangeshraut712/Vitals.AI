import { HealthDataStore } from '@/lib/store/health-data';
import type { HealthSnapshot } from '@/lib/agent/health-snapshot';

export async function loadHealthSnapshotFromStore(): Promise<HealthSnapshot> {
  const [biomarkers, bodyComp, activity, phenoAge, chronologicalAge, activitySource] = await Promise.all([
    HealthDataStore.getBiomarkers(),
    HealthDataStore.getBodyComp(),
    HealthDataStore.getActivity(),
    HealthDataStore.getPhenoAge(),
    HealthDataStore.getChronologicalAge(),
    HealthDataStore.getActivitySource(),
  ]);

  return {
    biomarkers,
    bodyComp,
    activity,
    phenoAge,
    chronologicalAge,
    activitySource,
  };
}
