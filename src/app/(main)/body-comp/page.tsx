import { HealthDataStore } from '@/lib/store/health-data';
import type { BodyComposition } from '@/lib/extractors/body-comp';
import { BodyCompClient } from './BodyCompClient';

export const dynamic = 'force-dynamic';

async function getBodyComp(): Promise<BodyComposition> {
  return await HealthDataStore.getBodyComp();
}

export default async function BodyCompPage(): Promise<React.JSX.Element> {
  const bodyComp = await getBodyComp();

  return <BodyCompClient bodyComp={bodyComp} />;
}
