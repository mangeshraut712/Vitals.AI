'use client';

import { useMemo, forwardRef } from 'react';
import { Group } from 'three';
import { createNeckGeometry } from '@/lib/digital-twin/geometry';
import { BODY_PROPORTIONS } from '@/lib/digital-twin/proportions';
import { getBaseMaterialProps, MaterialProps } from '@/lib/digital-twin/materials';

export interface NeckProps {
  /** Base color for the material */
  color?: string;
}

/**
 * Neck component connecting head and torso.
 * Smooth tapered cylinder that overlaps into both head and torso
 * to hide seams.
 * Bottom at Y=0.
 */
export const Neck = forwardRef<Group, NeckProps>(function Neck(
  { color },
  ref
) {
  // Create neck geometry using LatheGeometry
  const geometry = useMemo(() => {
    const { height, radiusBottom, radiusTop } = BODY_PROPORTIONS.neck;
    return createNeckGeometry(height, radiusBottom, radiusTop, 16);
  }, []);

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
