'use client';

import { useMemo, forwardRef } from 'react';
import { Group } from 'three';
import { createHeadGeometry } from '@/lib/digital-twin/geometry';
import { BODY_PROPORTIONS } from '@/lib/digital-twin/proportions';
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
}

/**
 * Head component with subtle oval/egg shape.
 * Slightly taller than wide with taper toward jaw.
 * Centered on Y axis.
 */
export const Head = forwardRef<Group, HeadProps>(function Head(
  { color, highlight, onClick },
  ref
) {
  // Create head geometry using LatheGeometry
  const geometry = useMemo(() => {
    const { width, height } = BODY_PROPORTIONS.head;
    return createHeadGeometry(width, height, 32);
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

export default Head;
