'use client';

import { useMemo, forwardRef } from 'react';
import { Group } from 'three';
import { createTaperedCapsule, createHandGeometry } from '@/lib/digital-twin/geometry';
import { BODY_PROPORTIONS, type BodyProportions } from '@/lib/digital-twin/proportions';
import { getBaseMaterialProps, getHighlightMaterialProps, MaterialProps } from '@/lib/digital-twin/materials';

export interface ArmHighlights {
  shoulder?: { color: string; intensity: number };
  elbow?: { color: string; intensity: number };
}

export interface ArmProps {
  /** Which side the arm is on */
  side: 'left' | 'right';
  /** Base color for the material */
  color?: string;
  /** Highlights for different parts of the arm */
  highlights?: ArmHighlights;
  /** Click handlers for different parts */
  onShoulderClick?: () => void;
  onElbowClick?: () => void;
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
 * Arm component with blended limb transitions.
 * Consists of: upper arm, forearm, hand.
 * Uses tapered capsule geometry for organic limb shapes.
 *
 * Hierarchy: upperArm → forearm → hand as nested groups.
 */
export const Arm = forwardRef<Group, ArmProps>(function Arm(
  { side, color, highlights, onShoulderClick, onElbowClick, intensityBoost, proportions = BODY_PROPORTIONS, opacity = 1, wireframe = false },
  ref
) {
  const xSign = side === 'left' ? -1 : 1;

  // Natural resting angle + slight backward sweep for a softer silhouette.
  const restingAngle = xSign * 0.055;

  // Create geometries
  const upperArmGeometry = useMemo(() => {
    const { length, radiusTop, radiusBottom } = proportions.upperArm;
    return createTaperedCapsule(length, radiusTop * 0.96, radiusBottom * 0.94, 10, 22);
  }, [proportions]);

  const forearmGeometry = useMemo(() => {
    const { length, radiusTop, radiusBottom } = proportions.forearm;
    return createTaperedCapsule(length, radiusTop * 0.96, radiusBottom * 0.92, 10, 20);
  }, [proportions]);

  const handGeometry = useMemo(() => {
    const { length, width } = proportions.hand;
    return createHandGeometry(length * 0.92, width * 0.92, 10);
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

  const shoulderHighlight = highlights?.shoulder;
  const elbowHighlight = highlights?.elbow;

  const upperArmMaterialProps: MaterialProps = useMemo(() => {
    if (shoulderHighlight) {
      const props = getHighlightMaterialProps(shoulderHighlight.color, shoulderHighlight.intensity * (intensityBoost ?? 1.0), color);
      return {
        ...props,
        opacity: (props.opacity ?? 1) * opacity,
        transparent: true,
      };
    }
    return baseMaterialProps;
  }, [shoulderHighlight, intensityBoost, color, baseMaterialProps, opacity]);

  const forearmMaterialProps: MaterialProps = useMemo(() => {
    if (elbowHighlight) {
      const props = getHighlightMaterialProps(elbowHighlight.color, elbowHighlight.intensity * (intensityBoost ?? 1.0), color);
      return {
        ...props,
        opacity: (props.opacity ?? 1) * opacity,
        transparent: true,
      };
    }
    return baseMaterialProps;
  }, [elbowHighlight, intensityBoost, color, baseMaterialProps, opacity]);

  // Positions
  const upperArmLength = proportions.upperArm.length;
  const forearmLength = proportions.forearm.length;
  const handLength = proportions.hand.length;
  const handDepth = proportions.hand.depth;
  const elbowJointOverlap = proportions.overlap.elbowOverlap * 1.25;

  return (
    <group ref={ref}>
      {/* Upper arm group - rotates from shoulder */}
      <group rotation={[0.01, 0, restingAngle]}>
        {/* Upper arm */}
        <mesh
          geometry={upperArmGeometry}
          position={[0, -upperArmLength / 2, -0.004]}
          castShadow={!wireframe}
          onClick={onShoulderClick}
        >
          <meshPhysicalMaterial {...upperArmMaterialProps} wireframe={wireframe} />
        </mesh>

        {/* Elbow group - at end of upper arm */}
        <group position={[0, -upperArmLength + elbowJointOverlap, -0.006]} rotation={[0.018, 0, 0]}>
          {/* Forearm */}
          <mesh
            geometry={forearmGeometry}
            position={[0, -forearmLength / 2, -0.003]}
            castShadow={!wireframe}
            onClick={onElbowClick}
          >
            <meshPhysicalMaterial {...forearmMaterialProps} wireframe={wireframe} />
          </mesh>

          {/* Hand group - at end of forearm */}
          <group
            position={[0, -forearmLength + proportions.overlap.elbowOverlap * 0.5, -0.006]}
            rotation={[0.05, xSign * 0.018, 0]}
          >
            <mesh
              geometry={handGeometry}
              position={[0, -handLength * 0.28, handDepth * 0.13]}
              castShadow={!wireframe}
            >
              <meshPhysicalMaterial {...baseMaterialProps} wireframe={wireframe} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
});

export default Arm;
