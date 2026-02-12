/**
 * Anatomical proportions for the digital twin model.
 *
 * Uses the "head units" system where 1 head = 0.28 world units.
 * Total height: 7.5 heads = 2.1 world units.
 *
 * Base proportions are neutral and can be resolved into male/female frames.
 */

// 1 head unit in world units
export const HEAD_UNIT = 0.28;

// Total figure height in world units
export const TOTAL_HEIGHT = 2.1;

export type BodyType = 'male' | 'female';

export interface BodyProportions {
  head: {
    height: number;
    width: number;
    depth: number;
    jawTaper: number;
  };
  neck: {
    height: number;
    radiusTop: number;
    radiusBottom: number;
  };
  torso: {
    height: number;
    shoulderWidth: number;
    waistWidth: number;
    hipWidth: number;
    shoulderHalfWidth: number;
    chestHalfWidth: number;
    waistHalfWidth: number;
    hipHalfWidth: number;
  };
  upperArm: {
    length: number;
    radiusTop: number;
    radiusBottom: number;
  };
  forearm: {
    length: number;
    radiusTop: number;
    radiusBottom: number;
  };
  hand: {
    length: number;
    width: number;
    depth: number;
  };
  thigh: {
    length: number;
    radiusTop: number;
    radiusBottom: number;
  };
  shin: {
    length: number;
    radiusTop: number;
    radiusBottom: number;
  };
  foot: {
    length: number;
    width: number;
    height: number;
  };
  overlap: {
    neckToHead: number;
    neckToTorso: number;
    shoulderToTorso: number;
    elbowOverlap: number;
    hipToTorso: number;
    kneeOverlap: number;
    ankleOverlap: number;
  };
}

export const BODY_PROPORTIONS: BodyProportions = {
  // Head
  head: {
    height: 0.28,
    width: 0.20,
    depth: 0.22, // slightly deeper than wide for realistic shape
    jawTaper: 0.86,
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
};

/**
 * Vertical positions (Y coordinates) for body parts.
 * Stack from ground up: feet at Y=0.
 */
export interface BodyPositions {
  ground: number;
  footBottom: number;
  footTop: number;
  ankleY: number;
  shinBottom: number;
  shinTop: number;
  kneeY: number;
  thighBottom: number;
  thighTop: number;
  hipY: number;
  torsoBottom: number;
  torsoTop: number;
  neckBottom: number;
  neckTop: number;
  headBottom: number;
  headTop: number;
}

export const BODY_POSITIONS: BodyPositions = {
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
};

/**
 * Horizontal positions for limbs.
 */
export interface LimbPositions {
  shoulderOffsetX: number;
  hipOffsetX: number;
  footRotationY: number;
}

export const LIMB_POSITIONS: LimbPositions = {
  // Arms positioned at shoulder width edges
  shoulderOffsetX: BODY_PROPORTIONS.torso.shoulderWidth / 2, // 0.225

  // Legs positioned at hip width (feet hip-width apart)
  hipOffsetX: 0.125, // ~0.25 units between feet centers

  // Feet angle outward
  footRotationY: Math.PI / 12, // 15 degrees
};

const BODY_TYPE_FACTORS: Record<
  BodyType,
  {
    headWidth: number;
    headDepth: number;
    jawTaper: number;
    neckRadius: number;
    shoulderWidth: number;
    chestWidth: number;
    waistWidth: number;
    hipWidth: number;
    upperArmRadius: number;
    forearmRadius: number;
    handWidth: number;
    thighRadius: number;
    shinRadius: number;
    footWidth: number;
  }
> = {
  male: {
    headWidth: 1.03,
    headDepth: 1.04,
    jawTaper: 0.92,
    neckRadius: 1.08,
    shoulderWidth: 1.12,
    chestWidth: 1.12,
    waistWidth: 1.03,
    hipWidth: 0.95,
    upperArmRadius: 1.08,
    forearmRadius: 1.06,
    handWidth: 1.05,
    thighRadius: 1.03,
    shinRadius: 1.02,
    footWidth: 1.04,
  },
  female: {
    headWidth: 0.97,
    headDepth: 0.98,
    jawTaper: 0.82,
    neckRadius: 0.94,
    shoulderWidth: 0.94,
    chestWidth: 0.98,
    waistWidth: 0.88,
    hipWidth: 1.12,
    upperArmRadius: 0.92,
    forearmRadius: 0.9,
    handWidth: 0.92,
    thighRadius: 1.05,
    shinRadius: 0.97,
    footWidth: 0.92,
  },
};

export function getBodyProportions(bodyType: BodyType = 'male'): BodyProportions {
  const base = BODY_PROPORTIONS;
  const scale = BODY_TYPE_FACTORS[bodyType];

  return {
    head: {
      ...base.head,
      width: base.head.width * scale.headWidth,
      depth: base.head.depth * scale.headDepth,
      jawTaper: scale.jawTaper,
    },
    neck: {
      ...base.neck,
      radiusTop: base.neck.radiusTop * scale.neckRadius,
      radiusBottom: base.neck.radiusBottom * scale.neckRadius,
    },
    torso: {
      ...base.torso,
      shoulderWidth: base.torso.shoulderWidth * scale.shoulderWidth,
      waistWidth: base.torso.waistWidth * scale.waistWidth,
      hipWidth: base.torso.hipWidth * scale.hipWidth,
      shoulderHalfWidth: base.torso.shoulderHalfWidth * scale.shoulderWidth,
      chestHalfWidth: base.torso.chestHalfWidth * scale.chestWidth,
      waistHalfWidth: base.torso.waistHalfWidth * scale.waistWidth,
      hipHalfWidth: base.torso.hipHalfWidth * scale.hipWidth,
    },
    upperArm: {
      ...base.upperArm,
      radiusTop: base.upperArm.radiusTop * scale.upperArmRadius,
      radiusBottom: base.upperArm.radiusBottom * scale.upperArmRadius,
    },
    forearm: {
      ...base.forearm,
      radiusTop: base.forearm.radiusTop * scale.forearmRadius,
      radiusBottom: base.forearm.radiusBottom * scale.forearmRadius,
    },
    hand: {
      ...base.hand,
      width: base.hand.width * scale.handWidth,
      depth: base.hand.depth * scale.handWidth,
    },
    thigh: {
      ...base.thigh,
      radiusTop: base.thigh.radiusTop * scale.thighRadius,
      radiusBottom: base.thigh.radiusBottom * scale.thighRadius,
    },
    shin: {
      ...base.shin,
      radiusTop: base.shin.radiusTop * scale.shinRadius,
      radiusBottom: base.shin.radiusBottom * scale.shinRadius,
    },
    foot: {
      ...base.foot,
      width: base.foot.width * scale.footWidth,
    },
    overlap: { ...base.overlap },
  };
}

export function getLimbPositions(proportions: BodyProportions): LimbPositions {
  return {
    shoulderOffsetX: proportions.torso.shoulderWidth / 2,
    hipOffsetX: Math.max(0.11, proportions.torso.hipWidth * 0.36),
    footRotationY: LIMB_POSITIONS.footRotationY,
  };
}
