'use client';

import { useMemo, forwardRef } from 'react';
import { Group, SphereGeometry } from 'three';
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
}

/**
 * Arm component with smooth shoulder connection.
 * Consists of: shoulder sphere, upper arm, elbow joint, forearm, hand.
 * Uses tapered capsule geometry for organic limb shapes.
 *
 * Hierarchy: shoulder → upperArm → forearm → hand as nested groups.
 */
export const Arm = forwardRef<Group, ArmProps>(function Arm(
  { side, color, highlights, onShoulderClick, onElbowClick, intensityBoost, proportions = BODY_PROPORTIONS },
  ref
) {
  const xSign = side === 'left' ? -1 : 1;

  // Natural resting angle: 5-8 degrees away from body
  const restingAngle = xSign * 0.12; // ~7 degrees in radians

  // Create geometries
  const shoulderGeometry = useMemo(() => {
    // Shoulder is a sphere that overlaps into torso edge
    return new SphereGeometry(proportions.upperArm.radiusTop * 1.1, 16, 16);
  }, [proportions]);

  const upperArmGeometry = useMemo(() => {
    const { length, radiusTop, radiusBottom } = proportions.upperArm;
    return createTaperedCapsule(length, radiusTop, radiusBottom, 8, 16);
  }, [proportions]);

  const elbowGeometry = useMemo(() => {
    // Small sphere at elbow for smooth joint
    const elbowRadius = (proportions.upperArm.radiusBottom + proportions.forearm.radiusTop) / 2;
    return new SphereGeometry(elbowRadius, 12, 12);
  }, [proportions]);

  const forearmGeometry = useMemo(() => {
    const { length, radiusTop, radiusBottom } = proportions.forearm;
    return createTaperedCapsule(length, radiusTop, radiusBottom, 8, 16);
  }, [proportions]);

  const handGeometry = useMemo(() => {
    const { length, width } = proportions.hand;
    return createHandGeometry(length, width, 12);
  }, [proportions]);

  // Material properties
  const baseMaterialProps: MaterialProps = useMemo(() => getBaseMaterialProps(color), [color]);
  const shoulderHighlight = highlights?.shoulder;
  const elbowHighlight = highlights?.elbow;

  const shoulderMaterialProps: MaterialProps = useMemo(() => {
    if (shoulderHighlight) {
      return getHighlightMaterialProps(shoulderHighlight.color, shoulderHighlight.intensity * (intensityBoost ?? 1.0), color);
    }
    return baseMaterialProps;
  }, [shoulderHighlight, intensityBoost, color, baseMaterialProps]);

  const elbowMaterialProps: MaterialProps = useMemo(() => {
    if (elbowHighlight) {
      return getHighlightMaterialProps(elbowHighlight.color, elbowHighlight.intensity * (intensityBoost ?? 1.0), color);
    }
    return baseMaterialProps;
  }, [elbowHighlight, intensityBoost, color, baseMaterialProps]);

  // Positions
  const upperArmLength = proportions.upperArm.length;
  const forearmLength = proportions.forearm.length;
  const handLength = proportions.hand.length;

  return (
    <group ref={ref}>
      {/* Shoulder joint - overlaps into torso */}
      <mesh
        geometry={shoulderGeometry}
        castShadow
        onClick={onShoulderClick}
      >
        <meshStandardMaterial {...shoulderMaterialProps} />
      </mesh>

      {/* Upper arm group - rotates from shoulder */}
      <group rotation={[0, 0, restingAngle]}>
        {/* Upper arm */}
        <mesh
          geometry={upperArmGeometry}
          position={[0, -upperArmLength / 2, 0]}
          castShadow
        >
          <meshStandardMaterial {...baseMaterialProps} />
        </mesh>

        {/* Elbow group - at end of upper arm */}
        <group position={[0, -upperArmLength, 0]}>
          {/* Elbow joint */}
          <mesh
            geometry={elbowGeometry}
            castShadow
            onClick={onElbowClick}
          >
            <meshStandardMaterial {...elbowMaterialProps} />
          </mesh>

          {/* Forearm */}
          <mesh
            geometry={forearmGeometry}
            position={[0, -forearmLength / 2, 0]}
            castShadow
          >
            <meshStandardMaterial {...baseMaterialProps} />
          </mesh>

          {/* Hand group - at end of forearm */}
          <group position={[0, -forearmLength, 0]}>
            <mesh
              geometry={handGeometry}
              position={[0, -handLength / 2, 0]}
              castShadow
            >
              <meshStandardMaterial {...baseMaterialProps} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
});

export default Arm;
