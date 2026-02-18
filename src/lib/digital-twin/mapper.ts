/**
 * Health to Body State Mapper
 *
 * Maps health data from HealthDataStore to BodyState for the digital twin.
 */

import { ExtractedBiomarkers } from '@/lib/extractors/biomarkers';
import { BodyComposition } from '@/lib/extractors/body-comp';
import { ActivityData } from '@/lib/store/health-data';
import {
  BodyState,
  PostureState,
  HighlightRegion,
  HIGHLIGHT_COLORS,
} from './types';
import { getVitalityColor } from './vitality';

export interface HealthDataInput {
  biomarkers: ExtractedBiomarkers;
  bodyComp: BodyComposition;
  activity: ActivityData[];
}

/**
 * Maps health data to body state for the digital twin
 */
export function mapHealthToBodyState(healthData: HealthDataInput): BodyState {
  const { biomarkers, bodyComp, activity } = healthData;

  // Calculate activity averages
  const avgSleepScore = calculateAverageSleepScore(activity);
  const avgHrv = calculateAverageHrv(activity);

  // Map to energy level
  const energyLevel = calculateEnergyLevel(avgSleepScore, avgHrv);

  // Determine posture from energy and HRV
  const posture = determinePosture(energyLevel, avgHrv);

  // Determine skin tone from energy
  const skinTone = determineSkinTone(energyLevel);

  // Calculate highlights from health markers
  const highlights = calculateHighlights(biomarkers, bodyComp);

  return {
    posture,
    energyLevel,
    skinTone,
    highlights,
  };
}

/**
 * Calculate average sleep score from activity data
 */
function calculateAverageSleepScore(activity: ActivityData[]): number {
  if (activity.length === 0) return 70; // Default moderate

  const scores = activity
    .map((a) => a.sleepScore)
    .filter((s): s is number => s !== undefined);

  if (scores.length === 0) {
    // Estimate from sleep hours if no score
    const avgHours =
      activity.reduce((sum, a) => sum + a.sleepHours, 0) / activity.length;
    // Map 5-9 hours to 30-100 score
    return Math.max(30, Math.min(100, ((avgHours - 5) / 4) * 70 + 30));
  }

  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

/**
 * Calculate average HRV from activity data
 */
function calculateAverageHrv(activity: ActivityData[]): number {
  if (activity.length === 0) return 50; // Default moderate

  return activity.reduce((sum, a) => sum + a.hrv, 0) / activity.length;
}

/**
 * Calculate overall energy level (0-100)
 */
function calculateEnergyLevel(sleepScore: number, hrv: number): number {
  // Weight: 60% sleep, 40% HRV
  // Normalize HRV: 20-100ms maps to 0-100 score
  const hrvScore = Math.max(0, Math.min(100, ((hrv - 20) / 80) * 100));

  return Math.round(sleepScore * 0.6 + hrvScore * 0.4);
}

/**
 * Determine posture based on energy and HRV
 */
function determinePosture(energyLevel: number, hrv: number): PostureState {
  // Very low HRV indicates fatigue regardless of sleep
  if (hrv < 30) return 'fatigued';

  // Map energy to posture
  if (energyLevel >= 75) return 'upright';
  if (energyLevel >= 55) return 'neutral';
  if (energyLevel >= 35) return 'slouched';
  return 'fatigued';
}

/**
 * Determine skin tone from energy level
 */
function determineSkinTone(energyLevel: number): string {
  return getVitalityColor(energyLevel);
}

/**
 * Calculate highlight regions based on health markers
 */
function calculateHighlights(
  biomarkers: ExtractedBiomarkers,
  bodyComp: BodyComposition
): HighlightRegion[] {
  const highlights: HighlightRegion[] = [];

  // Check visceral fat → torso-core highlight
  const visceralFat = bodyComp.visceralFat;
  if (visceralFat !== undefined) {
    if (visceralFat > 2.0) {
      highlights.push({
        area: 'torso-core',
        color: HIGHLIGHT_COLORS.critical,
        intensity: 0.6,
      });
    } else if (visceralFat > 1.5) {
      highlights.push({
        area: 'torso-core',
        color: HIGHLIGHT_COLORS.warning,
        intensity: 0.4,
      });
    } else if (visceralFat > 1.0) {
      highlights.push({
        area: 'torso-core',
        color: HIGHLIGHT_COLORS.mild,
        intensity: 0.2,
      });
    }
  }

  // Check CRP (inflammation marker) → joint highlights
  const crp = biomarkers.crp;
  if (crp !== undefined) {
    if (crp > 3.0) {
      // High inflammation - highlight multiple joints
      const jointColor = HIGHLIGHT_COLORS.critical;
      const intensity = 0.5;
      highlights.push(
        { area: 'left-shoulder', color: jointColor, intensity },
        { area: 'right-shoulder', color: jointColor, intensity },
        { area: 'left-knee', color: jointColor, intensity },
        { area: 'right-knee', color: jointColor, intensity }
      );
    } else if (crp > 2.0) {
      // Moderate inflammation
      const jointColor = HIGHLIGHT_COLORS.warning;
      const intensity = 0.35;
      highlights.push(
        { area: 'left-knee', color: jointColor, intensity },
        { area: 'right-knee', color: jointColor, intensity }
      );
    } else if (crp > 1.0) {
      // Mild inflammation
      highlights.push({
        area: 'left-knee',
        color: HIGHLIGHT_COLORS.mild,
        intensity: 0.2,
      });
    }
  }

  // Check body fat percentage (male thresholds)
  const bodyFatPercent = bodyComp.bodyFatPercent;
  if (bodyFatPercent !== undefined && bodyFatPercent > 25) {
    // No highlight, but this affects skin tone (handled elsewhere)
    // Could add subtle torso highlight if desired
  }

  return highlights;
}
