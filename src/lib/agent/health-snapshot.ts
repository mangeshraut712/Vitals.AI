import type { ExtractedBiomarkers } from '@/lib/extractors/biomarkers';
import type { BodyComposition } from '@/lib/extractors/body-comp';
import type { PhenoAgeResult } from '@/lib/calculations/phenoage';
import type { ActivityData } from '@/lib/store/health-data';
import type { TrackerType } from '@/lib/files';

export interface HealthSnapshot {
  biomarkers: ExtractedBiomarkers;
  bodyComp: BodyComposition;
  activity: ActivityData[];
  phenoAge: PhenoAgeResult | null;
  chronologicalAge: number | null;
  activitySource: TrackerType;
}

export function isEmptySnapshot(snapshot: HealthSnapshot): boolean {
  const biomarkerKeys = Object.keys(snapshot.biomarkers).filter(
    (key) => key !== 'all' && key !== 'patientAge'
  );
  return (
    biomarkerKeys.length === 0 &&
    Object.keys(snapshot.bodyComp).length === 0 &&
    snapshot.activity.length === 0 &&
    snapshot.phenoAge === null
  );
}
