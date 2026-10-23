import type { ExtractedBiomarkers } from '@/lib/extractors/biomarkers';
import type { BiomarkerStatus } from '@/lib/types/health';
import type { TopMarker } from '@/components/dashboard/TopMarkersCard';
import { getBiomarkerStatus } from './calculations';
import { BIOMARKER_REFERENCES } from './reference';

/**
 * Fixed markers that always appear in top 5
 * These are the most important for longevity
 */
const FIXED_MARKERS = ['apob', 'hba1c'] as const;

function normalizeMarkerKey(key: string): string {
  return key.toLowerCase();
}

/**
 * Longevity priority markers - ranked by clinical significance
 * These get prioritized when selecting the remaining 3 slots
 */
const LONGEVITY_PRIORITY = [
  'crp',
  'vitaminD',
  'ldl',
  'hdl',
  'triglycerides',
  'fastingInsulin',
  'homocysteine',
  'glucose',
  'albumin',
] as const;

/**
 * Markers to deprioritize even if out of range
 * These are either less clinically significant or harder to interpret
 */
const DEPRIORITIZED_MARKERS = [
  'alkalinePhosphatase',
  'mcv',
  'rdw',
  'wbc',
  'creatinine',
] as const;

interface MarkerWithScore {
  key: string;
  displayName: string;
  value: number;
  unit: string;
  status: BiomarkerStatus;
  score: number;
}

/**
 * Calculate priority score for a marker
 *
 * Higher score = higher priority
 * Score components:
 * - Status severity (out_of_range = 100, borderline = 50, normal = 10, optimal = 0)
 * - Longevity priority bonus (0-90 based on position in list)
 * - Deprioritized penalty (-50)
 */
function calculateMarkerScore(
  key: string,
  status: BiomarkerStatus
): number {
  let score = 0;

  // Status severity
  switch (status) {
    case 'out_of_range':
      score += 100;
      break;
    case 'borderline':
      score += 50;
      break;
    case 'normal':
      score += 10;
      break;
    case 'optimal':
      score += 0;
      break;
  }

  const normalizedKey = normalizeMarkerKey(key);
  const priorityIndex = LONGEVITY_PRIORITY.findIndex(
    (marker) => normalizeMarkerKey(marker) === normalizedKey
  );
  if (priorityIndex !== -1) {
    score += (LONGEVITY_PRIORITY.length - priorityIndex) * 10;
  }

  if (DEPRIORITIZED_MARKERS.some((marker) => normalizeMarkerKey(marker) === normalizedKey)) {
    score -= 50;
  }

  return score;
}

/**
 * Select top 5 personalized markers from biomarker data
 *
 * Selection logic:
 * 1. Always include ApoB (if available)
 * 2. Always include HbA1c (if available)
 * 3. Fill remaining slots with AI-ranked markers:
 *    - Prioritize out-of-range markers
 *    - Prioritize markers in LONGEVITY_PRIORITY list
 *    - Deprioritize obscure markers
 *
 * @param biomarkers - Extracted biomarker data
 * @returns Array of 5 TopMarker objects (or fewer if not enough data)
 */
export function selectTopMarkers(
  biomarkers: ExtractedBiomarkers
): TopMarker[] {
  const result: TopMarker[] = [];
  const usedKeys = new Set<string>();

  // Build list of all markers with their status and score
  const allMarkers: MarkerWithScore[] = [];

  for (const [key, value] of Object.entries(biomarkers)) {
    // Skip non-biomarker keys
    if (key === 'all' || key === 'patientAge' || typeof value !== 'number') {
      continue;
    }

    const ref = BIOMARKER_REFERENCES[key];
    if (!ref || !Number.isFinite(value)) continue;

    const status = getBiomarkerStatus(key, value);
    const score = calculateMarkerScore(key, status);

    allMarkers.push({
      key,
      displayName: ref.name,
      value,
      unit: ref.unit,
      status,
      score,
    });
  }

  // Step 1: Add fixed markers (ApoB, HbA1c)
  for (const fixedKey of FIXED_MARKERS) {
    const marker = allMarkers.find(
      (m) => m.key.toLowerCase() === fixedKey
    );
    if (marker && !usedKeys.has(marker.key)) {
      result.push({
        name: marker.displayName,
        value: marker.value,
        unit: marker.unit,
        status: marker.status,
      });
      usedKeys.add(marker.key);
    }
  }

  // Step 2: Sort remaining markers by score (descending)
  const remainingMarkers = allMarkers
    .filter((m) => !usedKeys.has(m.key))
    .sort((a, b) => b.score - a.score);

  // Step 3: Fill remaining slots (up to 5 total)
  for (const marker of remainingMarkers) {
    if (result.length >= 5) break;

    result.push({
      name: marker.displayName,
      value: marker.value,
      unit: marker.unit,
      status: marker.status,
    });
    usedKeys.add(marker.key);
  }

  return result;
}

export default selectTopMarkers;
