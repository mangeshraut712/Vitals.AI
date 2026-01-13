'use client';

import { useMemo, forwardRef } from 'react';
import { Group, SphereGeometry, BoxGeometry } from 'three';
import { createTaperedCapsule, createFootGeometry } from '@/lib/digital-twin/geometry';
import { BODY_PROPORTIONS, LIMB_POSITIONS } from '@/lib/digital-twin/proportions';
import { getBaseMaterialProps, getHighlightMaterialProps, MaterialProps } from '@/lib/digital-twin/materials';

export interface LegHighlights {
  hip?: { color: string; intensity: number };
  knee?: { color: string; intensity: number };
}

export interface LegProps {
  /** Which side the leg is on */
  side: 'left' | 'right';
  /** Base color for the material */
  color?: string;
  /** Highlights for different parts of the leg */
  highlights?: LegHighlights;
  /** Click handlers for different parts */
  onHipClick?: () => void;
  onKneeClick?: () => void;
}

/**
 * Leg component with natural stance.
 * Consists of: hip sphere, thigh, knee joint, shin, foot.
 * Uses tapered capsule geometry for organic limb shapes.
 *
 * Hierarchy: hip → thigh → shin → foot as nested groups.
 * Feet at Y=0 (ground level).
 */
export const Leg = forwardRef<Group, LegProps>(function Leg(
  { side, color, highlights, onHipClick, onKneeClick },
  ref
) {
  const xSign = side === 'left' ? -1 : 1;

  // Feet angle outward 10-15 degrees
  const footAngle = xSign * LIMB_POSITIONS.footRotationY;

  // Create geometries
  const hipGeometry = useMemo(() => {
    // Hip is a sphere that overlaps into torso bottom
    return new SphereGeometry(BODY_PROPORTIONS.thigh.radiusTop * 1.1, 16, 16);
  }, []);

  const thighGeometry = useMemo(() => {
    const { length, radiusTop, radiusBottom } = BODY_PROPORTIONS.thigh;
    return createTaperedCapsule(length, radiusTop, radiusBottom, 8, 16);
  }, []);

  const kneeGeometry = useMemo(() => {
    // Small sphere at knee for smooth joint
    const kneeRadius = (BODY_PROPORTIONS.thigh.radiusBottom + BODY_PROPORTIONS.shin.radiusTop) / 2;
    return new SphereGeometry(kneeRadius, 12, 12);
  }, []);

  const shinGeometry = useMemo(() => {
    const { length, radiusTop, radiusBottom } = BODY_PROPORTIONS.shin;
    return createTaperedCapsule(length, radiusTop, radiusBottom, 8, 16);
  }, []);

  const footGeometry = useMemo(() => {
    const { length, width, height } = BODY_PROPORTIONS.foot;
    // Use box geometry for foot - simple wedge shape
    return new BoxGeometry(width, height, length);
  }, []);

  // Material properties
  const baseMaterialProps: MaterialProps = useMemo(() => getBaseMaterialProps(color), [color]);

  const hipMaterialProps: MaterialProps = useMemo(() => {
    if (highlights?.hip) {
      return getHighlightMaterialProps(highlights.hip.color, highlights.hip.intensity, color);
    }
    return baseMaterialProps;
  }, [color, highlights?.hip, baseMaterialProps]);

  const kneeMaterialProps: MaterialProps = useMemo(() => {
    if (highlights?.knee) {
      return getHighlightMaterialProps(highlights.knee.color, highlights.knee.intensity, color);
    }
    return baseMaterialProps;
  }, [color, highlights?.knee, baseMaterialProps]);

  // Positions
  const thighLength = BODY_PROPORTIONS.thigh.length;
  const shinLength = BODY_PROPORTIONS.shin.length;
  const footHeight = BODY_PROPORTIONS.foot.height;
  const footLength = BODY_PROPORTIONS.foot.length;

  // Total leg height calculation
  // Hip is at top, foot bottom at Y=0
  const legTotalHeight = thighLength + shinLength + footHeight;

  return (
    <group ref={ref}>
      {/* Hip joint - overlaps into torso */}
      <mesh
        geometry={hipGeometry}
        castShadow
        onClick={onHipClick}
      >
        <meshStandardMaterial {...hipMaterialProps} />
      </mesh>

      {/* Thigh */}
      <mesh
        geometry={thighGeometry}
        position={[0, -thighLength / 2, 0]}
        castShadow
      >
        <meshStandardMaterial {...baseMaterialProps} />
      </mesh>

      {/* Knee group - at end of thigh */}
      <group position={[0, -thighLength, 0]}>
        {/* Knee joint */}
        <mesh
          geometry={kneeGeometry}
          castShadow
          onClick={onKneeClick}
        >
          <meshStandardMaterial {...kneeMaterialProps} />
        </mesh>

        {/* Shin */}
        <mesh
          geometry={shinGeometry}
          position={[0, -shinLength / 2, 0]}
          castShadow
        >
          <meshStandardMaterial {...baseMaterialProps} />
        </mesh>

        {/* Foot group - at end of shin */}
        <group position={[0, -shinLength, 0]} rotation={[0, footAngle, 0]}>
          {/* Foot - positioned so bottom is at Y=0 */}
          <mesh
            geometry={footGeometry}
            position={[0, footHeight / 2, footLength / 4]} // Offset forward
            castShadow
          >
            <meshStandardMaterial {...baseMaterialProps} />
          </mesh>
        </group>
      </group>
    </group>
  );
});

export default Leg;
