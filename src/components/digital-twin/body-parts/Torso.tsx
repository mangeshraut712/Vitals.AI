'use client';

import { useMemo, forwardRef } from 'react';
import { Group } from 'three';
import { createTorsoGeometry } from '@/lib/digital-twin/geometry';
import { BODY_PROPORTIONS } from '@/lib/digital-twin/proportions';
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
}

/**
 * Torso component with anatomical LatheGeometry shape.
 * Wider at shoulders, narrow at waist, slightly wider at hips.
 * Centered at origin, bottom at Y=0.
 */
export const Torso = forwardRef<Group, TorsoProps>(function Torso(
  { color, highlight, onClick },
  ref
) {
  // Create torso geometry using LatheGeometry
  const geometry = useMemo(() => {
    const { height, shoulderHalfWidth, waistHalfWidth, hipHalfWidth } = {
      height: BODY_PROPORTIONS.torso.height,
      shoulderHalfWidth: BODY_PROPORTIONS.torso.shoulderHalfWidth,
      waistHalfWidth: BODY_PROPORTIONS.torso.waistHalfWidth,
      hipHalfWidth: BODY_PROPORTIONS.torso.hipHalfWidth,
    };

    return createTorsoGeometry(
      height,
      shoulderHalfWidth,
      waistHalfWidth,
      hipHalfWidth,
      32 // 32 segments for smoothness
    );
  }, []);

  // Get material properties based on highlight state
  const materialProps: MaterialProps = useMemo(() => {
    if (highlight) {
      return getHighlightMaterialProps(highlight.color, highlight.intensity, color);
    }
    return getBaseMaterialProps(color);
  }, [color, highlight]);

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
