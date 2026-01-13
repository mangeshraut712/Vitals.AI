/**
 * Region Highlighting System
 *
 * Defines body regions and applies emissive highlights to indicate health issues.
 */

import { HighlightRegion, HighlightArea } from './types';

/**
 * Body region definitions mapping areas to component names
 */
export const BODY_REGIONS: Record<HighlightArea, string> = {
  'torso-core': 'torso',
  'left-shoulder': 'leftShoulder',
  'right-shoulder': 'rightShoulder',
  'left-elbow': 'leftElbow',
  'right-elbow': 'rightElbow',
  'left-hip': 'leftHip',
  'right-hip': 'rightHip',
  'left-knee': 'leftKnee',
  'right-knee': 'rightKnee',
  head: 'head',
};

/**
 * Get highlight info for a specific body region
 */
export function getHighlightForRegion(
  highlights: HighlightRegion[],
  area: HighlightArea
): HighlightRegion | null {
  return highlights.find((h) => h.area === area) ?? null;
}

/**
 * Calculate emissive material props from highlight
 */
export function getEmissiveProps(highlight: HighlightRegion | null): {
  emissive: string;
  emissiveIntensity: number;
} {
  if (!highlight) {
    return {
      emissive: '#000000',
      emissiveIntensity: 0,
    };
  }

  return {
    emissive: highlight.color,
    emissiveIntensity: highlight.intensity,
  };
}

/**
 * Check if a region is highlighted
 */
export function isRegionHighlighted(
  highlights: HighlightRegion[],
  area: HighlightArea
): boolean {
  return highlights.some((h) => h.area === area);
}
