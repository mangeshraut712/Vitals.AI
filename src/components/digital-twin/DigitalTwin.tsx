'use client';

import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  healthData?: {
    biomarkers: ExtractedBiomarkers;
    bodyComp: BodyComposition;
    activity: ActivityData[];
  };
}

type ViewMode = 'body' | 'muscle' | 'skeleton';

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

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

const defaultHealthData: HealthDataInput = {
  biomarkers: {},
  bodyComp: {},
  activity: [],
};

function RegionTooltip({ data, onClose }: RegionTooltipProps): React.JSX.Element {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-80 bg-black/80 border border-white/10 rounded-2xl p-5 shadow-2xl backdrop-blur-xl z-30"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-sm font-bold text-white uppercase tracking-wider">
              {data.label}
            </div>
            <div className="text-xs text-slate-400 mt-1 leading-relaxed">
              {data.description}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-full"
            aria-label="Close tooltip"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {data.metrics.map((metric, i) => (
            <div key={i} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
              <span className="text-slate-400 font-medium">{metric.name}</span>
              <div className="flex items-center gap-2">
                <span
                  className={`font-semibold tabular-nums ${metric.status === 'critical'
                    ? 'text-rose-400'
                    : metric.status === 'warning'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                    }`}
                >
                  {metric.value}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${metric.status === 'critical' ? 'bg-rose-500' :
                  metric.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function BodyTypeToggle({ value, onChange }: BodyTypeToggleProps): React.JSX.Element {
  return (
    <div className="absolute top-4 right-4 bg-black/40 border border-white/5 rounded-xl p-1 shadow-lg backdrop-blur-md z-20">
      <div className="flex relative">
        {(['male', 'female'] as const).map((type) => {
          const isActive = value === type;
          return (
            <button
              key={type}
              onClick={() => onChange(type)}
              className={`relative z-10 px-4 py-1.5 text-xs font-semibold transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              {type === 'male' ? 'Male' : 'Female'}
              {isActive && (
                <motion.div
                  layoutId="bodyTypeIndicator"
                  className="absolute inset-0 bg-white/10 rounded-lg -z-10 border border-white/10 shadow-sm"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ViewModeToggle({ value, onChange }: ViewModeToggleProps): React.JSX.Element {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/40 border border-white/5 rounded-xl p-1 shadow-lg backdrop-blur-md z-20">
      <div className="flex relative">
        {(['body', 'muscle', 'skeleton'] as const).map((mode) => {
          const isActive = value === mode;
          return (
            <button
              key={mode}
              onClick={() => onChange(mode)}
              className={`relative z-10 px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              {mode}
              {isActive && (
                <motion.div
                  layoutId="viewModeIndicator"
                  className="absolute inset-0 bg-white/10 rounded-lg -z-10 border border-white/15 shadow-[0_0_10px_rgba(226,232,240,0.08)]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatusOverlay({ energyLevel, highlightCount }: StatusOverlayProps): React.JSX.Element {
  return (
    <div className="absolute top-4 left-4 bg-black/40 border border-white/5 rounded-xl p-4 shadow-lg backdrop-blur-md z-20 min-w-[200px]">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/40 border ${energyLevel > 50 ? 'border-emerald-500/30 text-emerald-400' : 'border-amber-500/30 text-amber-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${energyLevel > 50 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span className="text-[10px] font-bold">
            {energyLevel > 75 ? 'OPTIMAL' : energyLevel > 50 ? 'GOOD' : 'ATTENTION'}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-end justify-between mb-2">
            <span className="text-xs font-medium text-slate-300">Vitality Score</span>
            <span className="text-xl font-bold tabular-nums text-white tracking-tight">{energyLevel}%</span>
          </div>

          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${energyLevel > 50 ? 'bg-gradient-to-r from-emerald-600 to-cyan-500' : 'bg-amber-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${energyLevel}%` }}
              transition={{ duration: 1.5, ease: "circOut" }}
            />
          </div>
        </div>

        {highlightCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-2 pt-3 border-t border-white/5"
          >
            <div className="w-5 h-5 rounded-full bg-rose-500/10 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            </div>
            <span className="text-xs text-rose-300 font-medium">
              {highlightCount} active alert{highlightCount !== 1 ? 's' : ''} detected
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export function DigitalTwin({ className, healthData }: DigitalTwinProps): React.JSX.Element {
  const [selectedRegion, setSelectedRegion] = useState<RegionHealthData | null>(null);
  const data = useMemo(() => healthData ?? defaultHealthData, [healthData]);
  const inferredBodyType: BodyType = data.bodyComp.sex === 'female' ? 'female' : 'male';

  const [bodyType, setBodyType] = useState<BodyType>(inferredBodyType);
  const [viewMode, setViewMode] = useState<ViewMode>('body');

  // Map to body state
  const bodyState: BodyState = useMemo(() => {
    try {
      const baseState = mapHealthToBodyState(data);

      // Override skin tone/material based on view mode
      let skinToneOverride = baseState.skinTone;
      if (viewMode === 'muscle') {
        skinToneOverride = '#c3ebe0'; // Mint tone for muscle view
      } else if (viewMode === 'skeleton') {
        skinToneOverride = '#dce4f0'; // Bone white
      }

      return {
        ...baseState,
        skinTone: skinToneOverride
      };
    } catch (error) {
      console.error('[DigitalTwin] Error mapping health data:', error);
      return DEFAULT_BODY_STATE;
    }
  }, [data, viewMode]);

  const handleRegionClick = useCallback(
    (area: HighlightArea) => {
      const regionData = getRegionHealthData(area, data.biomarkers, data.bodyComp);
      setSelectedRegion(regionData);
      // In a real app, you might want to auto-switch to relevant view mode here
    },
    [data]
  );

  const handleCloseTooltip = useCallback(() => {
    setSelectedRegion(null);
  }, []);

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`}>
      <TwinCanvas>
        <ProceduralHuman
          bodyState={bodyState}
          bodyType={bodyType}
          viewMode={viewMode}
          onRegionClick={handleRegionClick}
        />
      </TwinCanvas>

      {/* UI Layer */}
      <StatusOverlay
        energyLevel={bodyState.energyLevel}
        highlightCount={bodyState.highlights.length}
      />

      <ViewModeToggle value={viewMode} onChange={setViewMode} />

      <BodyTypeToggle value={bodyType} onChange={setBodyType} />

      {selectedRegion && (
        <RegionTooltip data={selectedRegion} onClose={handleCloseTooltip} />
      )}
    </div>
  );
}
