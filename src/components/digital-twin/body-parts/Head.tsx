'use client';

import { useMemo, forwardRef } from 'react';
import { Group } from 'three';
import { createHeadGeometry } from '@/lib/digital-twin/geometry';
import { BODY_PROPORTIONS, type BodyProportions } from '@/lib/digital-twin/proportions';
import { getBaseMaterialProps, getHighlightMaterialProps, MaterialProps } from '@/lib/digital-twin/materials';

export interface HeadProps {
  /** Base color for the material */
  color?: string;
  /** Whether this part is highlighted */
  highlight?: {
    color: string;
    intensity: number;
  };
  /** Click handler */
  onClick?: () => void;
  /** Emissive intensity multiplier for pulsing */
  intensityBoost?: number;
  /** Resolved anatomy profile */
  proportions?: BodyProportions;
}

/**
 * Head component with subtle oval/egg shape.
 * Slightly taller than wide with taper toward jaw.
 * Centered on Y axis.
 */
export const Head = forwardRef<Group, HeadProps>(function Head(
  { color, highlight, onClick, intensityBoost, proportions = BODY_PROPORTIONS },
  ref
) {
  // Create head geometry using LatheGeometry
  const geometry = useMemo(() => {
    const { width, height, jawTaper } = proportions.head;
    return createHeadGeometry(width, height, 32, jawTaper);
  }, [proportions]);

  // Get material properties based on highlight state
  const materialProps: MaterialProps = useMemo(() => {
    if (highlight) {
      const intensifiedHighlight = {
        ...highlight,
        intensity: highlight.intensity * (intensityBoost ?? 1.0)
      };
      return getHighlightMaterialProps(intensifiedHighlight.color, intensifiedHighlight.intensity, color);
    }
    return getBaseMaterialProps(color);
  }, [color, highlight, intensityBoost]);

  return (
    <group ref={ref}>
      <mesh
        geometry={geometry}
        scale={[1, 1, proportions.head.depth / proportions.head.width]}
        castShadow
        onClick={onClick}
      >
        <meshStandardMaterial {...materialProps} />
      </mesh>
    </group>
  );
});

export default Head;
