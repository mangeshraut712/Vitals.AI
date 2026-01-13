/**
 * Digital Twin Body State Types
 *
 * These types define the visual state of the procedural human model
 * based on health data inputs.
 */

/**
 * Posture state reflecting overall energy and health
 */
export type PostureState = 'upright' | 'slouched' | 'fatigued' | 'neutral';

/**
 * Region that can be highlighted on the body
 */
export type HighlightArea =
  | 'torso-core'
  | 'left-shoulder'
  | 'right-shoulder'
  | 'left-elbow'
  | 'right-elbow'
  | 'left-hip'
  | 'right-hip'
  | 'left-knee'
  | 'right-knee'
  | 'head';

/**
 * A highlighted region with color and intensity
 */
export interface HighlightRegion {
  area: HighlightArea;
  color: string; // Hex color for emissive glow
  intensity: number; // 0-1 range for emissive intensity
}

/**
 * Overall body state passed to the ProceduralHuman component
 */
export interface BodyState {
  /** Current posture based on energy/fatigue */
  posture: PostureState;

  /** Energy level 0-100 */
  energyLevel: number;

  /** Base skin tone color (hex) */
  skinTone: string;

  /** Regions to highlight with glows */
  highlights: HighlightRegion[];
}

/**
 * Default body state for a healthy individual
 */
export const DEFAULT_BODY_STATE: BodyState = {
  posture: 'upright',
  energyLevel: 80,
  skinTone: '#f0f0f0',
  highlights: [],
};

/**
 * Colors for different health statuses
 */
export const HIGHLIGHT_COLORS = {
  /** High inflammation or problem area */
  critical: '#ff4400',
  /** Moderate concern */
  warning: '#ff8800',
  /** Slight concern */
  mild: '#ffcc00',
} as const;

/**
 * Skin tone palette based on vitality
 */
export const VITALITY_TONES = {
  /** High energy - warm white */
  high: '#f5f0e8',
  /** Normal energy - neutral gray-white */
  normal: '#f0f0f0',
  /** Low energy - cooler gray */
  low: '#e0e4e8',
  /** Very low energy - desaturated */
  depleted: '#d8dce0',
} as const;
