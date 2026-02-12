'use client';

import { useMemo, useState, useCallback } from 'react';
import { TwinCanvas } from './TwinCanvas';
import { ProceduralHuman } from './ProceduralHuman';
import { mapHealthToBodyState, HealthDataInput } from '@/lib/digital-twin/mapper';
import { BodyState, DEFAULT_BODY_STATE, HighlightArea } from '@/lib/digital-twin/types';
import { getRegionHealthData, RegionHealthData } from '@/lib/digital-twin/regions';
import { BodyType } from '@/lib/digital-twin/proportions';
import { ExtractedBiomarkers } from '@/lib/extractors/biomarkers';
import { BodyComposition } from '@/lib/extractors/body-comp';
import { ActivityData } from '@/lib/store/health-data';

interface DigitalTwinProps {
  className?: string;
  /** Health data passed from server component */
  healthData?: {
    biomarkers: ExtractedBiomarkers;
    bodyComp: BodyComposition;
    activity: ActivityData[];
  };
}

/**
 * Get overall status from energy level
 */
function getOverallStatus(energyLevel: number): { label: string; color: string } {
  if (energyLevel >= 75) {
    return { label: 'Optimal', color: 'text-green-600 dark:text-green-400' };
  }
  if (energyLevel >= 55) {
    return { label: 'Good', color: 'text-blue-600 dark:text-blue-400' };
  }
  if (energyLevel >= 35) {
    return { label: 'Fair', color: 'text-yellow-600 dark:text-yellow-400' };
  }
  return { label: 'Needs Attention', color: 'text-red-600 dark:text-red-400' };
}

interface StatusOverlayProps {
  energyLevel: number;
  highlightCount: number;
}

interface RegionTooltipProps {
  data: RegionHealthData;
  onClose: () => void;
}

interface BodyTypeToggleProps {
  value: BodyType;
  onChange: (value: BodyType) => void;
}

function RegionTooltip({ data, onClose }: RegionTooltipProps): React.JSX.Element {
  return (
    <div className="absolute bottom-3 left-3 right-3 bg-card/95 dark:bg-zinc-900/95 rounded-lg p-4 shadow-lg backdrop-blur-sm">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            {data.label}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {data.description}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          aria-label="Close tooltip"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="space-y-1.5">
        {data.metrics.map((metric, i) => (
          <div key={i} className="flex justify-between items-center text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">{metric.name}</span>
            <span
              className={`font-medium ${
                metric.status === 'critical'
                  ? 'text-red-600 dark:text-red-400'
                  : metric.status === 'warning'
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-zinc-800 dark:text-zinc-200'
              }`}
            >
              {metric.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BodyTypeToggle({ value, onChange }: BodyTypeToggleProps): React.JSX.Element {
  return (
    <div className="absolute top-3 right-3 bg-card/90 dark:bg-zinc-900/90 rounded-lg p-2 shadow-sm backdrop-blur-sm">
      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">Body model</div>
      <div className="flex gap-1">
        {(['male', 'female'] as const).map((type) => {
          const isActive = value === type;
          return (
            <button
              key={type}
              onClick={() => onChange(type)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
              type="button"
            >
              {type === 'male' ? 'Male' : 'Female'}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatusOverlay({ energyLevel, highlightCount }: StatusOverlayProps): React.JSX.Element {
  const status = getOverallStatus(energyLevel);

  return (
    <div className="absolute top-3 left-3 bg-card/90 dark:bg-zinc-900/90 rounded-lg p-3 shadow-sm backdrop-blur-sm">
      <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Status</div>
      <div className={`text-sm font-semibold ${status.color}`}>{status.label}</div>

      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Energy</span>
          <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
            {energyLevel}%
          </span>
        </div>

        {/* Energy bar */}
        <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
            style={{ width: `${energyLevel}%` }}
          />
        </div>

        {highlightCount > 0 && (
          <div className="flex items-center justify-between gap-4 mt-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Areas of concern</span>
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              {highlightCount}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Default empty health data
const defaultHealthData: HealthDataInput = {
  biomarkers: {},
  bodyComp: {},
  activity: [],
};

/**
 * Main Digital Twin wrapper component
 *
 * Receives health data as props from a server component,
 * maps it to BodyState, and renders the ProceduralHuman.
 */
export function DigitalTwin({ className, healthData }: DigitalTwinProps): React.JSX.Element {
  // State for selected region tooltip
  const [selectedRegion, setSelectedRegion] = useState<RegionHealthData | null>(null);

  // Use provided health data or defaults
  const data = useMemo(() => healthData ?? defaultHealthData, [healthData]);
  const inferredBodyType: BodyType = data.bodyComp.sex === 'female' ? 'female' : 'male';
  const [bodyType, setBodyType] = useState<BodyType>(inferredBodyType);

  // Map to body state
  const bodyState: BodyState = useMemo(() => {
    try {
      return mapHealthToBodyState(data);
    } catch (error) {
      console.error('[DigitalTwin] Error mapping health data:', error);
      return DEFAULT_BODY_STATE;
    }
  }, [data]);

  // Handle region click
  const handleRegionClick = useCallback(
    (area: HighlightArea) => {
      const regionData = getRegionHealthData(area, data.biomarkers, data.bodyComp);
      setSelectedRegion(regionData);
    },
    [data]
  );

  // Close tooltip
  const handleCloseTooltip = useCallback(() => {
    setSelectedRegion(null);
  }, []);

  return (
    <div className={`relative ${className ?? ''}`}>
      <TwinCanvas>
        <ProceduralHuman
          bodyState={bodyState}
          bodyType={bodyType}
          onRegionClick={handleRegionClick}
        />
      </TwinCanvas>
      <StatusOverlay
        energyLevel={bodyState.energyLevel}
        highlightCount={bodyState.highlights.length}
      />
      <BodyTypeToggle value={bodyType} onChange={setBodyType} />
      {selectedRegion && (
        <RegionTooltip data={selectedRegion} onClose={handleCloseTooltip} />
      )}
    </div>
  );
}
