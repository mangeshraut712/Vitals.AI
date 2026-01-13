'use client';

import { useRef } from 'react';
import { Group } from 'three';
import { BodyState, DEFAULT_BODY_STATE, HighlightRegion, HighlightArea } from '@/lib/digital-twin/types';
import { getPostureRotations, getArmRotations } from '@/lib/digital-twin/posture';
import { getHighlightForRegion, getEmissiveProps } from '@/lib/digital-twin/highlights';

// Default material color for mannequin-like appearance
const BODY_COLOR = '#f0f0f0';

// Helper to get material props with optional highlight
function getMaterialProps(
  highlights: HighlightRegion[],
  area: HighlightArea,
  baseColor: string = BODY_COLOR
): { color: string; emissive: string; emissiveIntensity: number } {
  const highlight = getHighlightForRegion(highlights, area);
  const emissiveProps = getEmissiveProps(highlight);
  return {
    color: baseColor,
    ...emissiveProps,
  };
}

interface ProceduralHumanProps {
  position?: [number, number, number];
  bodyState?: BodyState;
}

interface HeadProps {
  rotationX?: number;
}

function Head({ rotationX = 0 }: HeadProps): React.JSX.Element {
  return (
    <group position={[0, 0.35, 0]} rotation={[rotationX, 0, 0]}>
      {/* Head - sphere */}
      <mesh castShadow>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshStandardMaterial color={BODY_COLOR} />
      </mesh>
    </group>
  );
}

interface NeckProps {
  rotationX?: number;
}

function Neck({ rotationX = 0 }: NeckProps): React.JSX.Element {
  return (
    <group position={[0, 0.2, 0]} rotation={[rotationX, 0, 0]}>
      {/* Neck - cylinder */}
      <mesh castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.15, 16]} />
        <meshStandardMaterial color={BODY_COLOR} />
      </mesh>
    </group>
  );
}

interface TorsoProps {
  highlights?: HighlightRegion[];
}

function Torso({ highlights = [] }: TorsoProps): React.JSX.Element {
  const torsoMaterial = getMaterialProps(highlights, 'torso-core');

  return (
    <group position={[0, -0.15, 0]}>
      {/* Upper torso (chest) - wider capsule */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <capsuleGeometry args={[0.14, 0.25, 8, 16]} />
        <meshStandardMaterial {...torsoMaterial} />
      </mesh>

      {/* Lower torso (abdomen) - slightly narrower */}
      <mesh position={[0, -0.15, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.15, 8, 16]} />
        <meshStandardMaterial {...torsoMaterial} />
      </mesh>
    </group>
  );
}

interface ArmProps {
  side: 'left' | 'right';
  shoulderRotationZ?: number;
  highlights?: HighlightRegion[];
}

interface LegProps {
  side: 'left' | 'right';
  highlights?: HighlightRegion[];
}

function Leg({ side, highlights = [] }: LegProps): React.JSX.Element {
  const xSign = side === 'left' ? -1 : 1;
  const hipX = xSign * 0.08;

  const hipArea: HighlightArea = side === 'left' ? 'left-hip' : 'right-hip';
  const kneeArea: HighlightArea = side === 'left' ? 'left-knee' : 'right-knee';

  const hipMaterial = getMaterialProps(highlights, hipArea);
  const kneeMaterial = getMaterialProps(highlights, kneeArea);

  return (
    <group position={[hipX, -0.4, 0]}>
      {/* Hip joint */}
      <mesh castShadow>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshStandardMaterial {...hipMaterial} />
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
            <meshStandardMaterial {...kneeMaterial} />
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

function Arm({ side, shoulderRotationZ = 0, highlights = [] }: ArmProps): React.JSX.Element {
  const xSign = side === 'left' ? -1 : 1;
  const shoulderX = xSign * 0.2;
  const baseRotation = xSign * 0.1;

  const shoulderArea: HighlightArea = side === 'left' ? 'left-shoulder' : 'right-shoulder';
  const elbowArea: HighlightArea = side === 'left' ? 'left-elbow' : 'right-elbow';

  const shoulderMaterial = getMaterialProps(highlights, shoulderArea);
  const elbowMaterial = getMaterialProps(highlights, elbowArea);

  return (
    <group position={[shoulderX, 0.25, 0]}>
      {/* Shoulder joint (small sphere) */}
      <mesh castShadow>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial {...shoulderMaterial} />
      </mesh>

      {/* Upper arm - rotated to hang at side, plus posture adjustment */}
      <group rotation={[0, 0, baseRotation + shoulderRotationZ]}>
        <mesh position={[0, -0.15, 0]} castShadow>
          <capsuleGeometry args={[0.04, 0.2, 8, 16]} />
          <meshStandardMaterial color={BODY_COLOR} />
        </mesh>

        {/* Elbow joint */}
        <group position={[0, -0.3, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.035, 16, 16]} />
            <meshStandardMaterial {...elbowMaterial} />
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

  // Use body state for rendering
  const { posture, energyLevel, highlights } = bodyState;

  // Calculate posture rotations
  const postureRotations = getPostureRotations(energyLevel, posture);
  const armRotations = getArmRotations(energyLevel);

  // Position the body so feet are at Y=0
  // Total height: ~1.8 units (human-like proportions)
  // Head top: ~1.8, feet: 0
  const bodyOffset = 0.9; // Center of body

  // Log body state for debugging (as per acceptance criteria)
  console.log('[DigitalTwin] Body state:', bodyState);
  console.log('[DigitalTwin] Highlights:', highlights);

  return (
    <group ref={groupRef} position={position}>
      {/* Main body group - offset to position feet at ground */}
      <group position={[0, bodyOffset, 0]}>
        {/* Spine rotation applied to upper body */}
        <group rotation={[postureRotations.spineX, 0, 0]}>
          {/* Head & Neck */}
          <group position={[0, 0.5, 0]}>
            <Head rotationX={postureRotations.headX} />
            <Neck rotationX={postureRotations.neckX} />
          </group>

          {/* Torso with highlights */}
          <Torso highlights={highlights} />

          {/* Arms with shoulder rotation and highlights */}
          <Arm side="left" shoulderRotationZ={armRotations.leftShoulderZ} highlights={highlights} />
          <Arm side="right" shoulderRotationZ={armRotations.rightShoulderZ} highlights={highlights} />
        </group>

        {/* Legs with highlights */}
        <Leg side="left" highlights={highlights} />
        <Leg side="right" highlights={highlights} />
      </group>
    </group>
  );
}
