import { getBiomarkerStatus, BIOMARKER_REFERENCES, type BiomarkerStatus } from '@/lib/types/health';
import type { ExtractedBiomarkers } from '@/lib/extractors/biomarkers';
import type { PhenoAgeResult } from '@/lib/calculations/phenoage';
import type { ActivityData } from '@/lib/store/health-data';

export interface HealthScoreBreakdown {
  biomarkerScore: number;
  biomarkerWeight: number;
  ageScore: number;
  ageWeight: number;
  activityScore: number;
  activityWeight: number;
  optimalCount: number;
  normalCount: number;
  outOfRangeCount: number;
  totalBiomarkers: number;
}

export interface HealthScoreResult {
  score: number;
  breakdown: HealthScoreBreakdown;
  status: 'optimal' | 'good' | 'fair' | 'needs_work';
  label: string;
}

// Weights for each component (must sum to 1)
const BIOMARKER_WEIGHT = 0.5;
const AGE_WEIGHT = 0.3;
const ACTIVITY_WEIGHT = 0.2;

function categorizeStatus(status: BiomarkerStatus): 'optimal' | 'normal' | 'outOfRange' {
  if (status === 'optimal') return 'optimal';
  if (status === 'normal' || status === 'borderline') return 'normal';
  return 'outOfRange';
}

/**
 * Calculate biomarker score (0-100)
 * Optimal = 100 points, Normal = 60 points, Out of range = 0 points
 *
 * Uses biomarkers.all array if available (from AI extraction),
 * falling back to individual keys for regex-extracted biomarkers.
 */
function calculateBiomarkerScore(biomarkers: ExtractedBiomarkers): {
  score: number;
  optimalCount: number;
  normalCount: number;
  outOfRangeCount: number;
  total: number;
} {
  let optimalCount = 0;
  let normalCount = 0;
  let outOfRangeCount = 0;
  let total = 0;

  // If we have the 'all' array from AI extraction, use it for counting
  // This gives us the actual lab flags (H/L/normal) for ALL biomarkers
  if (biomarkers.all && biomarkers.all.length > 0) {
    for (const marker of biomarkers.all) {
      total++;
      // Use the lab's own status flag
      if (marker.status === 'high' || marker.status === 'low') {
        outOfRangeCount++;
      } else {
        // 'normal' or undefined status counts as optimal/normal
        // We'll be generous and count unflagged as optimal
        optimalCount++;
      }
    }
  } else {
    // Fallback: count individual keys (regex extraction path)
    for (const [key, value] of Object.entries(biomarkers)) {
      if (key === 'patientAge' || key === 'all' || value === undefined) continue;
      if (typeof value !== 'number') continue;
      if (!BIOMARKER_REFERENCES[key]) continue;

      total++;
      const status = getBiomarkerStatus(key, value);
      const category = categorizeStatus(status);

      if (category === 'optimal') optimalCount++;
      else if (category === 'normal') normalCount++;
      else outOfRangeCount++;
    }
  }

  if (total === 0) {
    return { score: 50, optimalCount: 0, normalCount: 0, outOfRangeCount: 0, total: 0 };
  }

  // Weighted scoring: optimal=100, normal=60, outOfRange=0
  const score = ((optimalCount * 100) + (normalCount * 60) + (outOfRangeCount * 0)) / total;

  return { score, optimalCount, normalCount, outOfRangeCount, total };
}

/**
 * Calculate age delta score (0-100)
 * -10 years or better = 100, +10 years or worse = 0
 */
function calculateAgeScore(phenoAge: PhenoAgeResult | null): number {
  if (!phenoAge) return 50; // Default if no data

  const delta = phenoAge.delta;

  // Clamp delta to -10 to +10 range for scoring
  const clampedDelta = Math.max(-10, Math.min(10, delta));

  // Linear scale: -10 = 100, 0 = 50, +10 = 0
  const score = 50 - (clampedDelta * 5);

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate activity score (0-100)
 * Based on HRV, RHR, and sleep
 */
function calculateActivityScore(activity: ActivityData[]): number {
  if (activity.length === 0) return 50; // Default if no data

  // Calculate averages
  const avgHrv = activity.reduce((sum, d) => sum + d.hrv, 0) / activity.length;
  const avgRhr = activity.reduce((sum, d) => sum + d.rhr, 0) / activity.length;
  const avgSleep = activity.reduce((sum, d) => sum + d.sleepHours, 0) / activity.length;

  // Score each metric (rough guidelines)
  // HRV: 60+ optimal, 40-60 normal, <40 low
  const hrvScore = avgHrv >= 60 ? 100 : avgHrv >= 40 ? 70 : 40;

  // RHR: <60 optimal, 60-80 normal, >80 elevated
  const rhrScore = avgRhr < 60 ? 100 : avgRhr < 80 ? 70 : 40;

  // Sleep: 7-9 optimal, 6-7 or 9-10 normal, else poor
  const sleepScore = (avgSleep >= 7 && avgSleep <= 9) ? 100 :
                     (avgSleep >= 6 && avgSleep <= 10) ? 70 : 40;

  // Average the three metrics
  return (hrvScore + rhrScore + sleepScore) / 3;
}

function getScoreStatus(score: number): { status: HealthScoreResult['status']; label: string } {
  if (score >= 80) return { status: 'optimal', label: 'Optimal' };
  if (score >= 60) return { status: 'good', label: 'Good' };
  if (score >= 40) return { status: 'fair', label: 'Fair' };
  return { status: 'needs_work', label: 'Needs Work' };
}

export function calculateHealthScore(
  biomarkers: ExtractedBiomarkers,
  phenoAge: PhenoAgeResult | null,
  activity: ActivityData[]
): HealthScoreResult {
  const biomarkerResult = calculateBiomarkerScore(biomarkers);
  const ageScore = calculateAgeScore(phenoAge);
  const activityScore = calculateActivityScore(activity);

  // Weighted average
  const score = Math.round(
    (biomarkerResult.score * BIOMARKER_WEIGHT) +
    (ageScore * AGE_WEIGHT) +
    (activityScore * ACTIVITY_WEIGHT)
  );

  const { status, label } = getScoreStatus(score);

  return {
    score,
    breakdown: {
      biomarkerScore: Math.round(biomarkerResult.score),
      biomarkerWeight: BIOMARKER_WEIGHT,
      ageScore: Math.round(ageScore),
      ageWeight: AGE_WEIGHT,
      activityScore: Math.round(activityScore),
      activityWeight: ACTIVITY_WEIGHT,
      optimalCount: biomarkerResult.optimalCount,
      normalCount: biomarkerResult.normalCount,
      outOfRangeCount: biomarkerResult.outOfRangeCount,
      totalBiomarkers: biomarkerResult.total,
    },
    status,
    label,
  };
}
