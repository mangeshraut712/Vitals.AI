'use client';

import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';

// Body parts
import { Torso } from './body-parts/Torso';
import { Head } from './body-parts/Head';
import { Neck } from './body-parts/Neck';
import { Arm, ArmHighlights } from './body-parts/Arm';
import { Leg, LegHighlights } from './body-parts/Leg';

// Types and utilities
import { BodyState, DEFAULT_BODY_STATE, HighlightArea, HighlightRegion } from '@/lib/digital-twin/types';
import { BODY_PROPORTIONS, BODY_POSITIONS, LIMB_POSITIONS } from '@/lib/digital-twin/proportions';
import { getPostureRotations, getArmRotations } from '@/lib/digital-twin/posture';
import { getVitalityColor } from '@/lib/digital-twin/vitality';
import { MANNEQUIN_COLORS } from '@/lib/digital-twin/materials';
import { lerpPosture, lerpColor, AnimatedPosture, createDefaultAnimatedPosture } from '@/lib/digital-twin/animation';

export interface ProceduralHumanProps {
  position?: [number, number, number];
  bodyState?: BodyState;
  onRegionClick?: (area: HighlightArea) => void;
}

// Helper to extract highlight for a specific area
function getHighlightForArea(
  highlights: HighlightRegion[],
  area: HighlightArea
): { color: string; intensity: number } | undefined {
  const highlight = highlights.find((h) => h.area === area);
  return highlight ? { color: highlight.color, intensity: highlight.intensity } : undefined;
}

// Helper to build arm highlights from body state
function buildArmHighlights(
  highlights: HighlightRegion[],
  side: 'left' | 'right'
): ArmHighlights {
  const shoulderArea: HighlightArea = side === 'left' ? 'left-shoulder' : 'right-shoulder';
  const elbowArea: HighlightArea = side === 'left' ? 'left-elbow' : 'right-elbow';

  return {
    shoulder: getHighlightForArea(highlights, shoulderArea),
    elbow: getHighlightForArea(highlights, elbowArea),
  };
}

// Helper to build leg highlights from body state
function buildLegHighlights(
  highlights: HighlightRegion[],
  side: 'left' | 'right'
): LegHighlights {
  const hipArea: HighlightArea = side === 'left' ? 'left-hip' : 'right-hip';
  const kneeArea: HighlightArea = side === 'left' ? 'left-knee' : 'right-knee';

  return {
    hip: getHighlightForArea(highlights, hipArea),
    knee: getHighlightForArea(highlights, kneeArea),
  };
}

/**
 * ProceduralHuman - Complete mannequin assembled from body parts.
 *
 * Uses LatheGeometry-based components for smooth organic shapes.
 * No visible joints or seams between parts.
 */
export function ProceduralHuman({
  position = [0, 0, 0],
  bodyState = DEFAULT_BODY_STATE,
  onRegionClick,
}: ProceduralHumanProps): React.JSX.Element {
  // Refs for animation
  const groupRef = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);
  const spineRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const neckRef = useRef<Group>(null);
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const torsoRef = useRef<Group>(null);

  // Time accumulator for idle animations
  const timeRef = useRef<number>(0);

  // Animated state refs (persisted across frames)
  const animatedPosture = useRef<AnimatedPosture>(createDefaultAnimatedPosture());
  const animatedVitalityColor = useRef<string>(MANNEQUIN_COLORS.base);

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
  const [currentVitalityColor, setCurrentVitalityColor] = useState<string>(MANNEQUIN_COLORS.base);

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

    // === Idle breathing animation ===
    const breathCycle = Math.sin(timeRef.current * 1.5);
    if (torsoRef.current) {
      const breathScale = 1.0 + breathCycle * 0.012;
      torsoRef.current.scale.set(breathScale, 1.0, breathScale);
    }

    // === Subtle weight shift / sway ===
    const swayCycle = Math.sin(timeRef.current * 0.4);
    if (bodyRef.current) {
      bodyRef.current.rotation.y = swayCycle * 0.008;
    }

    // Update state periodically for material colors
    const colorDiff = Math.abs(
      parseInt(newColor.slice(1), 16) - parseInt(currentVitalityColor.slice(1), 16)
    );
    if (colorDiff > 500) {
      setCurrentVitalityColor(newColor);
    }
  });

  // Build highlights for sub-components
  const leftArmHighlights = useMemo(() => buildArmHighlights(highlights, 'left'), [highlights]);
  const rightArmHighlights = useMemo(() => buildArmHighlights(highlights, 'right'), [highlights]);
  const leftLegHighlights = useMemo(() => buildLegHighlights(highlights, 'left'), [highlights]);
  const rightLegHighlights = useMemo(() => buildLegHighlights(highlights, 'right'), [highlights]);
  const torsoHighlight = useMemo(() => getHighlightForArea(highlights, 'torso-core'), [highlights]);
  const headHighlight = useMemo(() => getHighlightForArea(highlights, 'head'), [highlights]);

  // Click handlers
  const handleHeadClick = useCallback(() => onRegionClick?.('head'), [onRegionClick]);
  const handleTorsoClick = useCallback(() => onRegionClick?.('torso-core'), [onRegionClick]);
  const handleLeftShoulderClick = useCallback(() => onRegionClick?.('left-shoulder'), [onRegionClick]);
  const handleLeftElbowClick = useCallback(() => onRegionClick?.('left-elbow'), [onRegionClick]);
  const handleRightShoulderClick = useCallback(() => onRegionClick?.('right-shoulder'), [onRegionClick]);
  const handleRightElbowClick = useCallback(() => onRegionClick?.('right-elbow'), [onRegionClick]);
  const handleLeftHipClick = useCallback(() => onRegionClick?.('left-hip'), [onRegionClick]);
  const handleLeftKneeClick = useCallback(() => onRegionClick?.('left-knee'), [onRegionClick]);
  const handleRightHipClick = useCallback(() => onRegionClick?.('right-hip'), [onRegionClick]);
  const handleRightKneeClick = useCallback(() => onRegionClick?.('right-knee'), [onRegionClick]);

  // Log body state for debugging (only on prop change)
  useEffect(() => {
    console.log('[DigitalTwin] Body state:', bodyState);
    console.log('[DigitalTwin] Target vitality color:', targetVitalityColor);
  }, [bodyState, targetVitalityColor]);

  // Positions based on proportions
  const { torso, neck, head } = BODY_PROPORTIONS;
  const { torsoBottom, torsoTop } = BODY_POSITIONS;

  // Calculate positions for a figure standing on Y=0
  // Torso bottom is at torsoBottom position
  const torsoY = torsoBottom;
  const neckY = torsoTop - BODY_PROPORTIONS.overlap.neckToTorso;
  const headY = neckY + neck.height - BODY_PROPORTIONS.overlap.neckToHead + head.height / 2;

  // Shoulders are at shoulder height on the torso
  const shoulderY = torsoBottom + torso.height * 0.85;
  const shoulderOffsetX = LIMB_POSITIONS.shoulderOffsetX;

  // Hips are at hip level
  const hipY = torsoBottom + torso.height * 0.08;
  const hipOffsetX = LIMB_POSITIONS.hipOffsetX;

  return (
    <group ref={groupRef} position={position}>
      {/* Main body group - with sway animation */}
      <group ref={bodyRef}>
        {/* Spine rotation applied to upper body */}
        <group ref={spineRef}>
          {/* Head */}
          <group ref={headRef} position={[0, headY, 0]}>
            <Head
              color={currentVitalityColor}
              highlight={headHighlight}
              onClick={handleHeadClick}
            />
          </group>

          {/* Neck */}
          <group ref={neckRef} position={[0, neckY, 0]}>
            <Neck color={currentVitalityColor} />
          </group>

          {/* Torso - with breathing animation */}
          <group ref={torsoRef} position={[0, torsoY, 0]}>
            <Torso
              color={currentVitalityColor}
              highlight={torsoHighlight}
              onClick={handleTorsoClick}
            />
          </group>

          {/* Left Arm */}
          <group position={[-shoulderOffsetX, shoulderY, 0]}>
            <Arm
              ref={leftArmRef}
              side="left"
              color={currentVitalityColor}
              highlights={leftArmHighlights}
              onShoulderClick={handleLeftShoulderClick}
              onElbowClick={handleLeftElbowClick}
            />
          </group>

          {/* Right Arm */}
          <group position={[shoulderOffsetX, shoulderY, 0]}>
            <Arm
              ref={rightArmRef}
              side="right"
              color={currentVitalityColor}
              highlights={rightArmHighlights}
              onShoulderClick={handleRightShoulderClick}
              onElbowClick={handleRightElbowClick}
            />
          </group>
        </group>

        {/* Legs - not affected by spine rotation */}
        {/* Left Leg */}
        <group position={[-hipOffsetX, hipY, 0]}>
          <Leg
            side="left"
            color={currentVitalityColor}
            highlights={leftLegHighlights}
            onHipClick={handleLeftHipClick}
            onKneeClick={handleLeftKneeClick}
          />
        </group>

        {/* Right Leg */}
        <group position={[hipOffsetX, hipY, 0]}>
          <Leg
            side="right"
            color={currentVitalityColor}
            highlights={rightLegHighlights}
            onHipClick={handleRightHipClick}
            onKneeClick={handleRightKneeClick}
          />
        </group>
      </group>
    </group>
  );
}
