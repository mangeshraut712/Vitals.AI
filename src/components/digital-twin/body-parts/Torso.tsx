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
}

/**
 * Torso component with anatomical LatheGeometry shape.
 * Wider at shoulders, narrow at waist, slightly wider at hips.
 * Centered at origin, bottom at Y=0.
 */
export const Torso = forwardRef<Group, TorsoProps>(function Torso(
  { color, highlight, onClick, intensityBoost, proportions = BODY_PROPORTIONS },
  ref
) {
  // Create torso geometry using LatheGeometry
  const geometry = useMemo(() => {
    const { height, shoulderHalfWidth, waistHalfWidth, hipHalfWidth } = {
      height: proportions.torso.height,
      shoulderHalfWidth: proportions.torso.shoulderHalfWidth,
      waistHalfWidth: proportions.torso.waistHalfWidth,
      hipHalfWidth: proportions.torso.hipHalfWidth,
    };

    return createTorsoGeometry(
      height,
      shoulderHalfWidth,
      waistHalfWidth,
      hipHalfWidth,
      32 // 32 segments for smoothness
    );
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
        castShadow
        onClick={onClick}
      >
        <meshStandardMaterial {...materialProps} />
      </mesh>
    </group>
  );
});

export default Torso;
