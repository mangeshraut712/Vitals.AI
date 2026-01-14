import { HealthDataStore } from '@/lib/store/health-data';
import { generateGoals, type Goal } from '@/lib/analysis/goals';
import { GoalsClient } from './GoalsClient';

function getGoals(): Goal[] {
  const biomarkers = HealthDataStore.getBiomarkers();
  const phenoAge = HealthDataStore.getPhenoAge();
  const bodyComp = HealthDataStore.getBodyComp();

  return generateGoals(biomarkers, phenoAge, bodyComp);
}

export default function GoalsPage(): React.JSX.Element {
  const autoGoals = getGoals();

  return <GoalsClient autoGoals={autoGoals} />;
}
