'use client';

import { useMemo, forwardRef } from 'react';
import { Group } from 'three';
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
  /** Opacity override for transparent modes */
  opacity?: number;
  /** Whether to render in wireframe mode */
  wireframe?: boolean;
}

/**
 * Leg component with natural stance.
 * Consists of: thigh, shin, foot.
 * Uses tapered capsule geometry for organic limb shapes.
 *
 * Hierarchy: thigh → shin → foot as nested groups.
 * Feet at Y=0 (ground level).
 */
export const Leg = forwardRef<Group, LegProps>(function Leg(
  { side, color, highlights, onHipClick, onKneeClick, intensityBoost, proportions = BODY_PROPORTIONS, opacity = 1, wireframe = false },
  ref
) {
  const xSign = side === 'left' ? -1 : 1;

  // Feet angle outward 10-15 degrees.
  const footAngle = xSign * LIMB_POSITIONS.footRotationY;

  // Create geometries
  const thighGeometry = useMemo(() => {
    const { length, radiusTop, radiusBottom } = proportions.thigh;
    return createTaperedCapsule(length, radiusTop * 0.96, radiusBottom * 0.93, 10, 22);
  }, [proportions]);

  const shinGeometry = useMemo(() => {
    const { length, radiusTop, radiusBottom } = proportions.shin;
    return createTaperedCapsule(length, radiusTop * 0.95, radiusBottom * 0.92, 10, 20);
  }, [proportions]);

  const footGeometry = useMemo(() => {
    const { length, width, height } = proportions.foot;
    return createFootGeometry(length * 0.98, width * 0.95, height * 0.96, 14);
  }, [proportions]);

  // Material properties
  const baseMaterialProps: MaterialProps = useMemo(() => {
    const props = getBaseMaterialProps(color);
    return {
      ...props,
      opacity: (props.opacity ?? 1) * opacity,
      transparent: true,
    };
  }, [color, opacity]);

  const hipHighlight = highlights?.hip;
  const kneeHighlight = highlights?.knee;

  const thighMaterialProps: MaterialProps = useMemo(() => {
    if (hipHighlight) {
      const props = getHighlightMaterialProps(hipHighlight.color, hipHighlight.intensity * (intensityBoost ?? 1.0), color);
      return {
        ...props,
        opacity: (props.opacity ?? 1) * opacity,
        transparent: true,
      };
    }
    return baseMaterialProps;
  }, [hipHighlight, intensityBoost, color, baseMaterialProps, opacity]);

  const shinMaterialProps: MaterialProps = useMemo(() => {
    if (kneeHighlight) {
      const props = getHighlightMaterialProps(kneeHighlight.color, kneeHighlight.intensity * (intensityBoost ?? 1.0), color);
      return {
        ...props,
        opacity: (props.opacity ?? 1) * opacity,
        transparent: true,
      };
    }
    return baseMaterialProps;
  }, [kneeHighlight, intensityBoost, color, baseMaterialProps, opacity]);

  // Positions
  const thighLength = proportions.thigh.length;
  const shinLength = proportions.shin.length;
  const footHeight = proportions.foot.height;
  const footLength = proportions.foot.length;
  const kneeJointOverlap = proportions.overlap.kneeOverlap * 1.3;
  const ankleJointOverlap = proportions.overlap.ankleOverlap * 1.1;

  return (
    <group ref={ref}>
      {/* Thigh */}
      <mesh
        geometry={thighGeometry}
        position={[0, -thighLength / 2, -0.005]}
        castShadow={!wireframe}
        onClick={onHipClick}
      >
        <meshPhysicalMaterial {...thighMaterialProps} wireframe={wireframe} />
      </mesh>

      {/* Knee group - at end of thigh */}
      <group position={[0, -thighLength + kneeJointOverlap, -0.006]} rotation={[-0.024, 0, xSign * 0.006]}>
        {/* Shin */}
        <mesh
          geometry={shinGeometry}
          position={[0, -shinLength / 2, -0.002]}
          castShadow={!wireframe}
          onClick={onKneeClick}
        >
          <meshPhysicalMaterial {...shinMaterialProps} wireframe={wireframe} />
        </mesh>

        {/* Foot group - at end of shin */}
        <group position={[0, -shinLength + ankleJointOverlap, -0.004]} rotation={[0.01, footAngle, 0]}>
          {/* Foot - positioned so bottom is at Y=0 */}
          <mesh
            geometry={footGeometry}
            position={[0, footHeight / 2, footLength * 0.2]}
            castShadow={!wireframe}
          >
            <meshPhysicalMaterial {...baseMaterialProps} wireframe={wireframe} />
          </mesh>
        </group>
      </group>
    </group>
  );
});

export default Leg;
