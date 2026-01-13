'use client';

import { useMemo, forwardRef } from 'react';
import { Group, SphereGeometry } from 'three';
import { createTaperedCapsule, createHandGeometry } from '@/lib/digital-twin/geometry';
import { BODY_PROPORTIONS, LIMB_POSITIONS } from '@/lib/digital-twin/proportions';
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
}

/**
 * Arm component with smooth shoulder connection.
 * Consists of: shoulder sphere, upper arm, elbow joint, forearm, hand.
 * Uses tapered capsule geometry for organic limb shapes.
 *
 * Hierarchy: shoulder → upperArm → forearm → hand as nested groups.
 */
export const Arm = forwardRef<Group, ArmProps>(function Arm(
  { side, color, highlights, onShoulderClick, onElbowClick },
  ref
) {
  const xSign = side === 'left' ? -1 : 1;

  // Natural resting angle: 5-8 degrees away from body
  const restingAngle = xSign * 0.12; // ~7 degrees in radians

  // Create geometries
  const shoulderGeometry = useMemo(() => {
    // Shoulder is a sphere that overlaps into torso edge
    return new SphereGeometry(BODY_PROPORTIONS.upperArm.radiusTop * 1.1, 16, 16);
  }, []);

  const upperArmGeometry = useMemo(() => {
    const { length, radiusTop, radiusBottom } = BODY_PROPORTIONS.upperArm;
    return createTaperedCapsule(length, radiusTop, radiusBottom, 8, 16);
  }, []);

  const elbowGeometry = useMemo(() => {
    // Small sphere at elbow for smooth joint
    const elbowRadius = (BODY_PROPORTIONS.upperArm.radiusBottom + BODY_PROPORTIONS.forearm.radiusTop) / 2;
    return new SphereGeometry(elbowRadius, 12, 12);
  }, []);

  const forearmGeometry = useMemo(() => {
    const { length, radiusTop, radiusBottom } = BODY_PROPORTIONS.forearm;
    return createTaperedCapsule(length, radiusTop, radiusBottom, 8, 16);
  }, []);

  const handGeometry = useMemo(() => {
    const { length, width } = BODY_PROPORTIONS.hand;
    return createHandGeometry(length, width, 12);
  }, []);

  // Material properties
  const baseMaterialProps: MaterialProps = useMemo(() => getBaseMaterialProps(color), [color]);

  const shoulderMaterialProps: MaterialProps = useMemo(() => {
    if (highlights?.shoulder) {
      return getHighlightMaterialProps(highlights.shoulder.color, highlights.shoulder.intensity, color);
    }
    return baseMaterialProps;
  }, [color, highlights?.shoulder, baseMaterialProps]);

  const elbowMaterialProps: MaterialProps = useMemo(() => {
    if (highlights?.elbow) {
      return getHighlightMaterialProps(highlights.elbow.color, highlights.elbow.intensity, color);
    }
    return baseMaterialProps;
  }, [color, highlights?.elbow, baseMaterialProps]);

  // Positions
  const upperArmLength = BODY_PROPORTIONS.upperArm.length;
  const forearmLength = BODY_PROPORTIONS.forearm.length;
  const handLength = BODY_PROPORTIONS.hand.length;

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
