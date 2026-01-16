'use client';

import dynamic from 'next/dynamic';
import type { ExtractedBiomarkers } from '@/lib/extractors/biomarkers';
import type { BodyComposition } from '@/lib/extractors/body-comp';
import type { ActivityData } from '@/lib/store/health-data';

// Dynamic import for heavy 3D component - reduces initial bundle by ~300KB (Rule 2.4)
const DigitalTwin = dynamic(
  () => import('./DigitalTwin').then((m) => m.DigitalTwin),
  {
    ssr: false,
    loading: () => (
      <div className="w-full min-h-[300px] bg-gray-50 rounded-xl animate-pulse flex items-center justify-center">
        <span className="text-sm text-gray-400">Loading Digital Twin...</span>
      </div>
    ),
  }
);

interface DigitalTwinLoaderProps {
  className?: string;
  healthData?: {
    biomarkers: ExtractedBiomarkers;
    bodyComp: BodyComposition;
    activity: ActivityData[];
  };
}

/**
 * Client-side loader wrapper for DigitalTwin
 * Enables dynamic import with ssr: false from Server Components
 */
export function DigitalTwinLoader({ className, healthData }: DigitalTwinLoaderProps): React.JSX.Element {
  return <DigitalTwin className={className} healthData={healthData} />;
}

export default DigitalTwinLoader;
