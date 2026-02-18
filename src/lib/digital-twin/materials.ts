/**
 * Material system for the digital twin mannequin.
 *
 * Creates clean matte materials for the mannequin look.
 * Supports base material and highlight variants.
 */

import { MeshStandardMaterial, Color } from 'three';

// Default mannequin colors
export const MANNEQUIN_COLORS = {
  base: '#d7dbe3', // Soft cool gray
  glassBase: '#c9d0dc',
  highlight: {
    warning: '#f59e0b', // Amber-500
    critical: '#ef4444', // Red-500
    info: '#3b82f6', // Blue-500
    optimal: '#10b981', // Emerald-500
    muscle: '#a855f7', // Purple-500 (Muscle view)
    fat: '#f43f5e', // Rose-500 (Fat view)
  },
} as const;

// Material settings tuned for human-like matte skin (less robotic/metallic).
const BASE_ROUGHNESS = 0.72;
const BASE_METALNESS = 0.02;

/**
 * Creates the base mannequin material.
 * Clean matte white for store mannequin look.
 *
 * @param color - Base color
 * @returns MeshStandardMaterial configured for mannequin look
 */
export function createBaseMaterial(color: string = MANNEQUIN_COLORS.base): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color,
    roughness: BASE_ROUGHNESS,
    metalness: BASE_METALNESS,
    transparent: true,
    opacity: 0.96,
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
    emissiveIntensity: Math.max(0.5, Math.min(4, intensity * 3.5)), // Boosted for Bloom effect
    transparent: true,
    opacity: 0.95,
  });
}

/**
 * Material properties for React Three Fiber components.
 * Use these with the meshPhysicalMaterial JSX element for the premium glass look.
 */
export interface MaterialProps {
  color: string;
  roughness: number;
  metalness: number;
  transmission?: number;
  thickness?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  ior?: number;
  emissive?: string;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
}

/**
 * Get base material props for JSX usage.
 *
 * @param color - Base color
 * @returns Props object for meshPhysicalMaterial
 */
export function getBaseMaterialProps(color: string = MANNEQUIN_COLORS.base): MaterialProps {
  return {
    color,
    roughness: 0.78,
    metalness: 0.0,
    transmission: 0.0,
    thickness: 0.0,
    clearcoat: 0.02,
    clearcoatRoughness: 0.8,
    ior: 1.35,
    transparent: true,
    opacity: 0.96,
  };
}

/**
 * Get highlight material props for JSX usage.
 *
 * @param highlightColor - Emissive highlight color
 * @param intensity - Emissive intensity (0-1)
 * @param baseColor - Base material color
 * @returns Props object for meshPhysicalMaterial with emissive
 */
export function getHighlightMaterialProps(
  highlightColor: string = MANNEQUIN_COLORS.highlight.warning,
  intensity: number = 0.4,
  baseColor: string = MANNEQUIN_COLORS.base
): MaterialProps {
  return {
    color: baseColor,
    roughness: 0.62,
    metalness: 0.0,
    emissive: highlightColor,
    emissiveIntensity: Math.max(0.45, Math.min(2.5, intensity * 1.9)),
    transmission: 0.0,
    thickness: 0.0,
    clearcoat: 0.03,
    clearcoatRoughness: 0.72,
    ior: 1.35,
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
