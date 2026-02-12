import { HealthDataStore } from '@/lib/store/health-data';
import { generateGoals, type Goal } from '@/lib/analysis/goals';
import { GoalsClient } from './GoalsClient';

export const dynamic = 'force-dynamic';

async function getGoals(): Promise<Goal[]> {
  const biomarkers = await HealthDataStore.getBiomarkers();
  const phenoAge = await HealthDataStore.getPhenoAge();
  const bodyComp = await HealthDataStore.getBodyComp();

  return generateGoals(biomarkers, phenoAge, bodyComp);
}

export default async function GoalsPage(): Promise<React.JSX.Element> {
  const autoGoals = await getGoals();

  return <GoalsClient autoGoals={autoGoals} />;
}
