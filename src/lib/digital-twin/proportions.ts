/**
 * Anatomical proportions for the digital twin mannequin.
 *
 * Uses the "head units" system where 1 head = 0.28 world units.
 * Total height: 7.5 heads = 2.1 world units.
 *
 * These proportions create a clean, professional mannequin look.
 */

// 1 head unit in world units
export const HEAD_UNIT = 0.28;

// Total figure height in world units
export const TOTAL_HEIGHT = 2.1;

export const BODY_PROPORTIONS = {
  // Head
  head: {
    height: 0.28,
    width: 0.20,
    depth: 0.22, // slightly deeper than wide for realistic shape
  },

  // Neck
  neck: {
    height: 0.08,
    radiusTop: 0.055,
    radiusBottom: 0.065, // slightly wider at base
  },

  // Torso
  torso: {
    height: 0.70,
    shoulderWidth: 0.45,
    waistWidth: 0.30,
    hipWidth: 0.35,
    // LatheGeometry profile widths (half-widths from center)
    shoulderHalfWidth: 0.225,
    chestHalfWidth: 0.20,
    waistHalfWidth: 0.15,
    hipHalfWidth: 0.175,
  },

  // Arms
  upperArm: {
    length: 0.36,
    radiusTop: 0.045, // at shoulder
    radiusBottom: 0.035, // at elbow
  },
  forearm: {
    length: 0.30,
    radiusTop: 0.035, // at elbow
    radiusBottom: 0.025, // at wrist
  },
  hand: {
    length: 0.18,
    width: 0.08,
    depth: 0.03,
  },

  // Legs
  thigh: {
    length: 0.50,
    radiusTop: 0.065, // at hip
    radiusBottom: 0.045, // at knee
  },
  shin: {
    length: 0.48,
    radiusTop: 0.045, // at knee
    radiusBottom: 0.030, // at ankle
  },
  foot: {
    length: 0.25,
    width: 0.09,
    height: 0.06,
  },

  // Joint overlaps (for hiding seams)
  overlap: {
    neckToHead: 0.02,
    neckToTorso: 0.02,
    shoulderToTorso: 0.015,
    elbowOverlap: 0.01,
    hipToTorso: 0.02,
    kneeOverlap: 0.01,
    ankleOverlap: 0.01,
  },
} as const;

/**
 * Vertical positions (Y coordinates) for body parts.
 * Stack from ground up: feet at Y=0.
 */
export const BODY_POSITIONS = {
  // Ground level
  ground: 0,

  // Feet bottom at ground
  footBottom: 0,
  footTop: BODY_PROPORTIONS.foot.height, // 0.06

  // Ankle joint
  ankleY: BODY_PROPORTIONS.foot.height, // 0.06

  // Shin (from ankle to knee)
  shinBottom: BODY_PROPORTIONS.foot.height, // 0.06
  shinTop: BODY_PROPORTIONS.foot.height + BODY_PROPORTIONS.shin.length, // 0.54

  // Knee joint
  kneeY: BODY_PROPORTIONS.foot.height + BODY_PROPORTIONS.shin.length, // 0.54

  // Thigh (from knee to hip)
  thighBottom: BODY_PROPORTIONS.foot.height + BODY_PROPORTIONS.shin.length, // 0.54
  thighTop: BODY_PROPORTIONS.foot.height + BODY_PROPORTIONS.shin.length + BODY_PROPORTIONS.thigh.length, // 1.04

  // Hip joint (slightly below torso bottom)
  hipY: BODY_PROPORTIONS.foot.height + BODY_PROPORTIONS.shin.length + BODY_PROPORTIONS.thigh.length - 0.02, // 1.02

  // Torso
  torsoBottom: BODY_PROPORTIONS.foot.height + BODY_PROPORTIONS.shin.length + BODY_PROPORTIONS.thigh.length - 0.06, // 0.98
  torsoTop: BODY_PROPORTIONS.foot.height + BODY_PROPORTIONS.shin.length + BODY_PROPORTIONS.thigh.length + BODY_PROPORTIONS.torso.height - 0.06, // 1.68

  // Neck
  neckBottom: 1.66, // overlaps into torso by 0.02
  neckTop: 1.74,

  // Head
  headBottom: 1.72, // overlaps into neck by 0.02
  headTop: 2.04, // head height 0.28 + overlap
} as const;

/**
 * Horizontal positions for limbs.
 */
export const LIMB_POSITIONS = {
  // Arms positioned at shoulder width edges
  shoulderOffsetX: BODY_PROPORTIONS.torso.shoulderWidth / 2, // 0.225

  // Legs positioned at hip width (feet hip-width apart)
  hipOffsetX: 0.125, // ~0.25 units between feet centers

  // Feet angle outward
  footRotationY: Math.PI / 12, // 15 degrees
} as const;

export type BodyProportions = typeof BODY_PROPORTIONS;
export type BodyPositions = typeof BODY_POSITIONS;
export type LimbPositions = typeof LIMB_POSITIONS;
