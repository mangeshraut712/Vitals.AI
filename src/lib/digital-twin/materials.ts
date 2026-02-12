/**
 * Material system for the digital twin mannequin.
 *
 * Creates clean matte materials for the mannequin look.
 * Supports base material and highlight variants.
 */

import { MeshStandardMaterial, Color } from 'three';

// Default mannequin colors
export const MANNEQUIN_COLORS = {
  base: '#f1f5f9', // Slate-100 base
  highlight: {
    warning: '#f59e0b', // Amber-500
    critical: '#ef4444', // Red-500
    info: '#3b82f6', // Blue-500
    optimal: '#10b981', // Emerald-500
  },
} as const;

// Material settings tuned for human-like matte skin (less robotic/metallic).
const BASE_ROUGHNESS = 0.58;
const BASE_METALNESS = 0.04;

/**
 * Creates the base mannequin material.
 * Clean matte white for store mannequin look.
 *
 * @param color - Base color (default warm white #fafafa)
 * @returns MeshStandardMaterial configured for mannequin look
 */
export function createBaseMaterial(color: string = MANNEQUIN_COLORS.base): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color,
    roughness: BASE_ROUGHNESS,
    metalness: BASE_METALNESS,
    transparent: true,
    opacity: 0.85,
  });
}

export function createHighlightMaterial(
  color: string = MANNEQUIN_COLORS.highlight.warning,
  intensity: number = 0.6,
  baseColor: string = MANNEQUIN_COLORS.base
): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: baseColor,
    roughness: 0.42,
    metalness: 0.08,
    emissive: new Color(color),
    emissiveIntensity: Math.max(0.2, Math.min(2, intensity * 2)), // Boost intensity
    transparent: true,
    opacity: 0.95,
  });
}

/**
 * Material properties for React Three Fiber components.
 * Use these with the meshStandardMaterial JSX element.
 */
export interface MaterialProps {
  color: string;
  roughness: number;
  metalness: number;
  emissive?: string;
  emissiveIntensity?: number;
}

/**
 * Get base material props for JSX usage.
 *
 * @param color - Base color
 * @returns Props object for meshStandardMaterial
 */
export function getBaseMaterialProps(color: string = MANNEQUIN_COLORS.base): MaterialProps {
  return {
    color,
    roughness: BASE_ROUGHNESS,
    metalness: BASE_METALNESS,
  };
}

/**
 * Get highlight material props for JSX usage.
 *
 * @param highlightColor - Emissive highlight color
 * @param intensity - Emissive intensity (0-1)
 * @param baseColor - Base material color
 * @returns Props object for meshStandardMaterial with emissive
 */
export function getHighlightMaterialProps(
  highlightColor: string = MANNEQUIN_COLORS.highlight.warning,
  intensity: number = 0.4,
  baseColor: string = MANNEQUIN_COLORS.base
): MaterialProps {
  return {
    color: baseColor,
    roughness: BASE_ROUGHNESS,
    metalness: BASE_METALNESS,
    emissive: highlightColor,
    emissiveIntensity: Math.max(0, Math.min(1, intensity)),
  };
}

/**
 * Shared material instances for performance.
 * Use these when you don't need unique materials per mesh.
 */
export const sharedMaterials = {
  base: createBaseMaterial(),
  highlightWarning: createHighlightMaterial(MANNEQUIN_COLORS.highlight.warning, 0.4),
  highlightCritical: createHighlightMaterial(MANNEQUIN_COLORS.highlight.critical, 0.5),
  highlightInfo: createHighlightMaterial(MANNEQUIN_COLORS.highlight.info, 0.3),
} as const;
