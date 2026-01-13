'use client';

import { useRef } from 'react';
import { Group } from 'three';
import { BodyState, DEFAULT_BODY_STATE } from '@/lib/digital-twin/types';

// Default material color for mannequin-like appearance
const BODY_COLOR = '#f0f0f0';

interface ProceduralHumanProps {
  position?: [number, number, number];
  bodyState?: BodyState;
}

function Head(): React.JSX.Element {
  return (
    <group position={[0, 0.35, 0]}>
      {/* Head - sphere */}
      <mesh castShadow>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshStandardMaterial color={BODY_COLOR} />
      </mesh>
    </group>
  );
}

function Neck(): React.JSX.Element {
  return (
    <group position={[0, 0.2, 0]}>
      {/* Neck - cylinder */}
      <mesh castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.15, 16]} />
        <meshStandardMaterial color={BODY_COLOR} />
      </mesh>
    </group>
  );
}

function Torso(): React.JSX.Element {
  return (
    <group position={[0, -0.15, 0]}>
      {/* Upper torso (chest) - wider capsule */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <capsuleGeometry args={[0.14, 0.25, 8, 16]} />
        <meshStandardMaterial color={BODY_COLOR} />
      </mesh>

      {/* Lower torso (abdomen) - slightly narrower */}
      <mesh position={[0, -0.15, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.15, 8, 16]} />
        <meshStandardMaterial color={BODY_COLOR} />
      </mesh>
    </group>
  );
}

interface ArmProps {
  side: 'left' | 'right';
}

interface LegProps {
  side: 'left' | 'right';
}

function Leg({ side }: LegProps): React.JSX.Element {
  const xSign = side === 'left' ? -1 : 1;
  const hipX = xSign * 0.08;

  return (
    <group position={[hipX, -0.4, 0]}>
      {/* Hip joint */}
      <mesh castShadow>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshStandardMaterial color={BODY_COLOR} />
      </mesh>

      {/* Thigh */}
      <group>
        <mesh position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.055, 0.28, 8, 16]} />
          <meshStandardMaterial color={BODY_COLOR} />
        </mesh>

        {/* Knee joint */}
        <group position={[0, -0.42, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshStandardMaterial color={BODY_COLOR} />
          </mesh>

          {/* Shin */}
          <mesh position={[0, -0.2, 0]} castShadow>
            <capsuleGeometry args={[0.04, 0.28, 8, 16]} />
            <meshStandardMaterial color={BODY_COLOR} />
          </mesh>

          {/* Foot */}
          <group position={[0, -0.42, 0.03]}>
            <mesh castShadow>
              <boxGeometry args={[0.08, 0.04, 0.14]} />
              <meshStandardMaterial color={BODY_COLOR} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

function Arm({ side }: ArmProps): React.JSX.Element {
  const xSign = side === 'left' ? -1 : 1;
  const shoulderX = xSign * 0.2;

  return (
    <group position={[shoulderX, 0.25, 0]}>
      {/* Shoulder joint (small sphere) */}
      <mesh castShadow>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial color={BODY_COLOR} />
      </mesh>

      {/* Upper arm - rotated to hang at side */}
      <group rotation={[0, 0, xSign * 0.1]}>
        <mesh position={[0, -0.15, 0]} castShadow>
          <capsuleGeometry args={[0.04, 0.2, 8, 16]} />
          <meshStandardMaterial color={BODY_COLOR} />
        </mesh>

        {/* Elbow joint */}
        <group position={[0, -0.3, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.035, 16, 16]} />
            <meshStandardMaterial color={BODY_COLOR} />
          </mesh>

          {/* Forearm */}
          <mesh position={[0, -0.13, 0]} castShadow>
            <capsuleGeometry args={[0.035, 0.18, 8, 16]} />
            <meshStandardMaterial color={BODY_COLOR} />
          </mesh>

          {/* Hand */}
          <group position={[0, -0.3, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.04, 16, 16]} />
              <meshStandardMaterial color={BODY_COLOR} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

export function ProceduralHuman({
  position = [0, 0, 0],
  bodyState = DEFAULT_BODY_STATE,
}: ProceduralHumanProps): React.JSX.Element {
  const groupRef = useRef<Group>(null);

  // Use body state for rendering (will be expanded in later stories)
  const { skinTone } = bodyState;

  // Position the body so feet are at Y=0
  // Total height: ~1.8 units (human-like proportions)
  // Head top: ~1.8, feet: 0
  const bodyOffset = 0.9; // Center of body

  // Log body state for debugging (as per acceptance criteria)
  console.log('[DigitalTwin] Body state:', bodyState);

  return (
    <group ref={groupRef} position={position}>
      {/* Main body group - offset to position feet at ground */}
      <group position={[0, bodyOffset, 0]}>
        {/* Head & Neck */}
        <group position={[0, 0.5, 0]}>
          <Head />
          <Neck />
        </group>

        {/* Torso */}
        <Torso />

        {/* Arms */}
        <Arm side="left" />
        <Arm side="right" />

        {/* Legs */}
        <Leg side="left" />
        <Leg side="right" />
      </group>
    </group>
  );
}
