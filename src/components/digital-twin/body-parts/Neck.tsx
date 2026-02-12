'use client';

import { useMemo, forwardRef } from 'react';
import { Group } from 'three';
import { createNeckGeometry } from '@/lib/digital-twin/geometry';
import { BODY_PROPORTIONS, type BodyProportions } from '@/lib/digital-twin/proportions';
import { getBaseMaterialProps, MaterialProps } from '@/lib/digital-twin/materials';

export interface NeckProps {
  /** Base color for the material */
  color?: string;
  /** Resolved anatomy profile */
  proportions?: BodyProportions;
}

/**
 * Neck component connecting head and torso.
 * Smooth tapered cylinder that overlaps into both head and torso
 * to hide seams.
 * Bottom at Y=0.
 */
export const Neck = forwardRef<Group, NeckProps>(function Neck(
  { color, proportions = BODY_PROPORTIONS },
  ref
) {
  // Create neck geometry using LatheGeometry
  const geometry = useMemo(() => {
    const { height, radiusBottom, radiusTop } = proportions.neck;
    return createNeckGeometry(height, radiusBottom, radiusTop, 16);
  }, [proportions]);

  // Get material properties
  const materialProps: MaterialProps = useMemo(() => {
    return getBaseMaterialProps(color);
  }, [color]);

  return (
    <group ref={ref}>
      <mesh
        geometry={geometry}
        castShadow
      >
        <meshStandardMaterial {...materialProps} />
      </mesh>
    </group>
  );
});

export default Neck;
