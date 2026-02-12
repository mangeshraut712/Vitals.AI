'use client';

import { useMemo, forwardRef } from 'react';
import { Group, SphereGeometry } from 'three';
import { createTaperedCapsule, createFootGeometry } from '@/lib/digital-twin/geometry';
import { BODY_PROPORTIONS, LIMB_POSITIONS, type BodyProportions } from '@/lib/digital-twin/proportions';
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
  /** Emissive intensity multiplier for pulsing */
  intensityBoost?: number;
  /** Resolved anatomy profile */
  proportions?: BodyProportions;
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
  { side, color, highlights, onHipClick, onKneeClick, intensityBoost, proportions = BODY_PROPORTIONS },
  ref
) {
  const xSign = side === 'left' ? -1 : 1;

  // Feet angle outward 10-15 degrees
  const footAngle = xSign * LIMB_POSITIONS.footRotationY;

  // Create geometries
  const hipGeometry = useMemo(() => {
    // Hip is a sphere that overlaps into torso bottom
    return new SphereGeometry(proportions.thigh.radiusTop * 1.1, 16, 16);
  }, [proportions]);

  const thighGeometry = useMemo(() => {
    const { length, radiusTop, radiusBottom } = proportions.thigh;
    return createTaperedCapsule(length, radiusTop, radiusBottom, 8, 16);
  }, [proportions]);

  const kneeGeometry = useMemo(() => {
    // Small sphere at knee for smooth joint
    const kneeRadius = (proportions.thigh.radiusBottom + proportions.shin.radiusTop) / 2;
    return new SphereGeometry(kneeRadius, 12, 12);
  }, [proportions]);

  const shinGeometry = useMemo(() => {
    const { length, radiusTop, radiusBottom } = proportions.shin;
    return createTaperedCapsule(length, radiusTop, radiusBottom, 8, 16);
  }, [proportions]);

  const footGeometry = useMemo(() => {
    const { length, width, height } = proportions.foot;
    return createFootGeometry(length, width, height, 14);
  }, [proportions]);

  // Material properties
  const baseMaterialProps: MaterialProps = useMemo(() => getBaseMaterialProps(color), [color]);
  const hipHighlight = highlights?.hip;
  const kneeHighlight = highlights?.knee;

  const hipMaterialProps: MaterialProps = useMemo(() => {
    if (hipHighlight) {
      return getHighlightMaterialProps(hipHighlight.color, hipHighlight.intensity * (intensityBoost ?? 1.0), color);
    }
    return baseMaterialProps;
  }, [hipHighlight, intensityBoost, color, baseMaterialProps]);

  const kneeMaterialProps: MaterialProps = useMemo(() => {
    if (kneeHighlight) {
      return getHighlightMaterialProps(kneeHighlight.color, kneeHighlight.intensity * (intensityBoost ?? 1.0), color);
    }
    return baseMaterialProps;
  }, [kneeHighlight, intensityBoost, color, baseMaterialProps]);

  // Positions
  const thighLength = proportions.thigh.length;
  const shinLength = proportions.shin.length;
  const footHeight = proportions.foot.height;
  const footLength = proportions.foot.length;

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
