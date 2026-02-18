'use client';

import { useMemo, forwardRef } from 'react';
import { Group } from 'three';
import { createTorsoGeometry } from '@/lib/digital-twin/geometry';
import { BODY_PROPORTIONS, type BodyProportions } from '@/lib/digital-twin/proportions';
import { getBaseMaterialProps, getHighlightMaterialProps, MaterialProps } from '@/lib/digital-twin/materials';

export interface TorsoProps {
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
  /** Opacity override for transparent modes */
  opacity?: number;
  /** Whether to render in wireframe mode */
  wireframe?: boolean;
}

/**
 * Torso component with anatomical LatheGeometry shape.
 * Wider at shoulders, narrow at waist, slightly wider at hips.
 * Centered at origin, bottom at Y=0.
 */
export const Torso = forwardRef<Group, TorsoProps>(function Torso(
  { color, highlight, onClick, intensityBoost, proportions = BODY_PROPORTIONS, opacity = 1, wireframe = false },
  ref
) {
  // Create torso geometry using LatheGeometry
  const geometry = useMemo(() => {
    const { height, shoulderHalfWidth, chestHalfWidth, waistHalfWidth, hipHalfWidth } = {
      height: proportions.torso.height,
      shoulderHalfWidth: proportions.torso.shoulderHalfWidth,
      chestHalfWidth: proportions.torso.chestHalfWidth,
      waistHalfWidth: proportions.torso.waistHalfWidth,
      hipHalfWidth: proportions.torso.hipHalfWidth,
    };

    return createTorsoGeometry(
      height,
      shoulderHalfWidth,
      chestHalfWidth,
      waistHalfWidth,
      hipHalfWidth,
      32 // 32 segments for smoothness
    );
  }, [proportions]);

  // Get material properties based on highlight state
  const materialProps: MaterialProps = useMemo(() => {
    const baseProps = highlight
      ? getHighlightMaterialProps(
        highlight.color,
        highlight.intensity * (intensityBoost ?? 1.0),
        color
      )
      : getBaseMaterialProps(color);

    return {
      ...baseProps,
      opacity: (baseProps.opacity ?? 1) * opacity,
      transparent: true,
    };
  }, [color, highlight, intensityBoost, opacity]);

  return (
    <group ref={ref}>
      <mesh
        geometry={geometry}
        castShadow={!wireframe}
        onClick={onClick}
      >
        <meshPhysicalMaterial {...materialProps} wireframe={wireframe} />
      </mesh>
    </group>
  );
});

export default Torso;
