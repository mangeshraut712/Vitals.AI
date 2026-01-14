import { HealthDataStore } from '@/lib/store/health-data';
import type { BodyComposition } from '@/lib/extractors/body-comp';
import { BodyCompClient } from './BodyCompClient';

function getBodyComp(): BodyComposition {
  return HealthDataStore.getBodyComp();
}

export default function BodyCompPage(): React.JSX.Element {
  const bodyComp = getBodyComp();

  return <BodyCompClient bodyComp={bodyComp} />;
}
