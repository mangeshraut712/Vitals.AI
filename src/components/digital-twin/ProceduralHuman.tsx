'use client';

import { useRef, useState, useEffect } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { BodyState, DEFAULT_BODY_STATE, HighlightRegion, HighlightArea } from '@/lib/digital-twin/types';
import { getPostureRotations, getArmRotations } from '@/lib/digital-twin/posture';
import { getHighlightForRegion, getEmissiveProps } from '@/lib/digital-twin/highlights';
import { getVitalityColor } from '@/lib/digital-twin/vitality';
import {
  AnimatedPosture,
  createDefaultAnimatedPosture,
  lerpPosture,
  lerpColor,
} from '@/lib/digital-twin/animation';

// Default material color for mannequin-like appearance (fallback)
const DEFAULT_BODY_COLOR = '#f0f0f0';

// Helper to get material props with optional highlight
function getMaterialProps(
  highlights: HighlightRegion[],
  area: HighlightArea,
  baseColor: string = DEFAULT_BODY_COLOR
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
  vitalityColor?: string;
}

function Head({ rotationX = 0, vitalityColor = DEFAULT_BODY_COLOR }: HeadProps): React.JSX.Element {
  return (
    <group position={[0, 0.35, 0]} rotation={[rotationX, 0, 0]}>
      {/* Head - sphere */}
      <mesh castShadow>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshStandardMaterial color={vitalityColor} />
      </mesh>
    </group>
  );
}

interface NeckProps {
  rotationX?: number;
  vitalityColor?: string;
}

function Neck({ rotationX = 0, vitalityColor = DEFAULT_BODY_COLOR }: NeckProps): React.JSX.Element {
  return (
    <group position={[0, 0.2, 0]} rotation={[rotationX, 0, 0]}>
      {/* Neck - cylinder */}
      <mesh castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.15, 16]} />
        <meshStandardMaterial color={vitalityColor} />
      </mesh>
    </group>
  );
}

interface TorsoProps {
  highlights?: HighlightRegion[];
  vitalityColor?: string;
}

function Torso({ highlights = [], vitalityColor = DEFAULT_BODY_COLOR }: TorsoProps): React.JSX.Element {
  const torsoMaterial = getMaterialProps(highlights, 'torso-core', vitalityColor);

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
  vitalityColor?: string;
}

interface LegProps {
  side: 'left' | 'right';
  highlights?: HighlightRegion[];
  vitalityColor?: string;
}

function Leg({ side, highlights = [], vitalityColor = DEFAULT_BODY_COLOR }: LegProps): React.JSX.Element {
  const xSign = side === 'left' ? -1 : 1;
  const hipX = xSign * 0.08;

  const hipArea: HighlightArea = side === 'left' ? 'left-hip' : 'right-hip';
  const kneeArea: HighlightArea = side === 'left' ? 'left-knee' : 'right-knee';

  const hipMaterial = getMaterialProps(highlights, hipArea, vitalityColor);
  const kneeMaterial = getMaterialProps(highlights, kneeArea, vitalityColor);

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
          <meshStandardMaterial color={vitalityColor} />
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
            <meshStandardMaterial color={vitalityColor} />
          </mesh>

          {/* Foot */}
          <group position={[0, -0.42, 0.03]}>
            <mesh castShadow>
              <boxGeometry args={[0.08, 0.04, 0.14]} />
              <meshStandardMaterial color={vitalityColor} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

function Arm({ side, shoulderRotationZ = 0, highlights = [], vitalityColor = DEFAULT_BODY_COLOR }: ArmProps): React.JSX.Element {
  const xSign = side === 'left' ? -1 : 1;
  const shoulderX = xSign * 0.2;
  const baseRotation = xSign * 0.1;

  const shoulderArea: HighlightArea = side === 'left' ? 'left-shoulder' : 'right-shoulder';
  const elbowArea: HighlightArea = side === 'left' ? 'left-elbow' : 'right-elbow';

  const shoulderMaterial = getMaterialProps(highlights, shoulderArea, vitalityColor);
  const elbowMaterial = getMaterialProps(highlights, elbowArea, vitalityColor);

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
          <meshStandardMaterial color={vitalityColor} />
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
            <meshStandardMaterial color={vitalityColor} />
          </mesh>

          {/* Hand */}
          <group position={[0, -0.3, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.04, 16, 16]} />
              <meshStandardMaterial color={vitalityColor} />
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
  const spineRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const neckRef = useRef<Group>(null);
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const torsoRef = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);

  // Time accumulator for idle animations
  const timeRef = useRef<number>(0);

  // Animated state refs (persisted across frames)
  const animatedPosture = useRef<AnimatedPosture>(createDefaultAnimatedPosture());
  const animatedVitalityColor = useRef<string>(DEFAULT_BODY_COLOR);

  // Use body state for rendering
  const { posture, energyLevel, highlights } = bodyState;

  // Calculate target posture rotations
  const targetPostureRotations = getPostureRotations(energyLevel, posture);
  const targetArmRotations = getArmRotations(energyLevel);

  // Calculate target vitality color
  const targetVitalityColor = getVitalityColor(energyLevel);

  // Target posture state for animation
  const targetPosture: AnimatedPosture = {
    spineX: targetPostureRotations.spineX,
    neckX: targetPostureRotations.neckX,
    headX: targetPostureRotations.headX,
    leftShoulderZ: targetArmRotations.leftShoulderZ,
    rightShoulderZ: targetArmRotations.rightShoulderZ,
  };

  // State for re-rendering with animated vitality color
  const [currentVitalityColor, setCurrentVitalityColor] = useState<string>(DEFAULT_BODY_COLOR);

  // Animate posture and colors each frame
  useFrame((_, delta) => {
    // Accumulate time for idle animations
    timeRef.current += delta;

    // Lerp posture toward target
    const newPosture = lerpPosture(animatedPosture.current, targetPosture, delta);
    animatedPosture.current = newPosture;

    // Lerp vitality color
    const newColor = lerpColor(animatedVitalityColor.current, targetVitalityColor, delta);
    animatedVitalityColor.current = newColor;

    // Apply rotations directly to group refs for smooth animation
    if (spineRef.current) {
      spineRef.current.rotation.x = newPosture.spineX;
    }
    if (headRef.current) {
      headRef.current.rotation.x = newPosture.headX;
    }
    if (neckRef.current) {
      neckRef.current.rotation.x = newPosture.neckX;
    }
    if (leftArmRef.current) {
      leftArmRef.current.rotation.z = -0.1 + newPosture.leftShoulderZ;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.z = 0.1 + newPosture.rightShoulderZ;
    }

    // === Idle breathing animation ===
    // Breathing cycle: ~4 seconds (0.25 Hz)
    const breathCycle = Math.sin(timeRef.current * 1.5);
    // Torso scale: 1.0 to 1.02 for subtle breathing
    if (torsoRef.current) {
      const breathScale = 1.0 + breathCycle * 0.015;
      torsoRef.current.scale.set(breathScale, 1.0, breathScale);
    }

    // === Subtle weight shift / sway ===
    // Very slow Y-axis rotation: ~8 second cycle
    const swayCycle = Math.sin(timeRef.current * 0.4);
    if (bodyRef.current) {
      // Very gentle sway: +/- 0.01 radians (~0.6 degrees)
      bodyRef.current.rotation.y = swayCycle * 0.01;
    }

    // Update state periodically for material colors (less frequent)
    // Only update when there's significant change to avoid excessive re-renders
    const colorDiff = Math.abs(
      parseInt(newColor.slice(1), 16) - parseInt(currentVitalityColor.slice(1), 16)
    );
    if (colorDiff > 1000) {
      setCurrentVitalityColor(newColor);
    }
  });

  // Position the body so feet are at Y=0
  const bodyOffset = 0.9;

  // Log body state for debugging (only on prop change, not every frame)
  useEffect(() => {
    console.log('[DigitalTwin] Body state:', bodyState);
    console.log('[DigitalTwin] Target vitality color:', targetVitalityColor);
  }, [bodyState, targetVitalityColor]);

  return (
    <group ref={groupRef} position={position}>
      {/* Main body group - offset to position feet at ground, with sway animation */}
      <group ref={bodyRef} position={[0, bodyOffset, 0]}>
        {/* Spine rotation applied to upper body - animated via ref */}
        <group ref={spineRef}>
          {/* Head & Neck */}
          <group position={[0, 0.5, 0]}>
            <group ref={headRef} position={[0, 0.35, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.12, 32, 32]} />
                <meshStandardMaterial color={currentVitalityColor} />
              </mesh>
            </group>
            <group ref={neckRef} position={[0, 0.2, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.04, 0.05, 0.15, 16]} />
                <meshStandardMaterial color={currentVitalityColor} />
              </mesh>
            </group>
          </group>

          {/* Torso with highlights and vitality - wrapped for breathing animation */}
          <group ref={torsoRef}>
            <Torso highlights={highlights} vitalityColor={currentVitalityColor} />
          </group>

          {/* Arms with animated shoulder rotation */}
          <group position={[-0.2, 0.25, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.045, 16, 16]} />
              <meshStandardMaterial {...getMaterialProps(highlights, 'left-shoulder', currentVitalityColor)} />
            </mesh>
            <group ref={leftArmRef}>
              <mesh position={[0, -0.15, 0]} castShadow>
                <capsuleGeometry args={[0.04, 0.2, 8, 16]} />
                <meshStandardMaterial color={currentVitalityColor} />
              </mesh>
              <group position={[0, -0.3, 0]}>
                <mesh castShadow>
                  <sphereGeometry args={[0.035, 16, 16]} />
                  <meshStandardMaterial {...getMaterialProps(highlights, 'left-elbow', currentVitalityColor)} />
                </mesh>
                <mesh position={[0, -0.13, 0]} castShadow>
                  <capsuleGeometry args={[0.035, 0.18, 8, 16]} />
                  <meshStandardMaterial color={currentVitalityColor} />
                </mesh>
                <mesh position={[0, -0.3, 0]} castShadow>
                  <sphereGeometry args={[0.04, 16, 16]} />
                  <meshStandardMaterial color={currentVitalityColor} />
                </mesh>
              </group>
            </group>
          </group>

          <group position={[0.2, 0.25, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.045, 16, 16]} />
              <meshStandardMaterial {...getMaterialProps(highlights, 'right-shoulder', currentVitalityColor)} />
            </mesh>
            <group ref={rightArmRef}>
              <mesh position={[0, -0.15, 0]} castShadow>
                <capsuleGeometry args={[0.04, 0.2, 8, 16]} />
                <meshStandardMaterial color={currentVitalityColor} />
              </mesh>
              <group position={[0, -0.3, 0]}>
                <mesh castShadow>
                  <sphereGeometry args={[0.035, 16, 16]} />
                  <meshStandardMaterial {...getMaterialProps(highlights, 'right-elbow', currentVitalityColor)} />
                </mesh>
                <mesh position={[0, -0.13, 0]} castShadow>
                  <capsuleGeometry args={[0.035, 0.18, 8, 16]} />
                  <meshStandardMaterial color={currentVitalityColor} />
                </mesh>
                <mesh position={[0, -0.3, 0]} castShadow>
                  <sphereGeometry args={[0.04, 16, 16]} />
                  <meshStandardMaterial color={currentVitalityColor} />
                </mesh>
              </group>
            </group>
          </group>
        </group>

        {/* Legs with highlights and vitality */}
        <Leg side="left" highlights={highlights} vitalityColor={currentVitalityColor} />
        <Leg side="right" highlights={highlights} vitalityColor={currentVitalityColor} />
      </group>
    </group>
  );
}
