/**
 * Geometry utilities for creating smooth, organic body shapes.
 *
 * Uses LatheGeometry for rotational symmetry shapes (limbs, torso).
 * All geometries are centered on the Y axis.
 */

import { LatheGeometry, Vector2, BufferGeometry, CapsuleGeometry } from 'three';

/**
 * Creates a smooth tapered capsule geometry using LatheGeometry.
 * Has rounded hemisphere end caps and tapers from top to bottom.
 *
 * @param length - Total length of the capsule (including caps)
 * @param radiusTop - Radius at the top end
 * @param radiusBottom - Radius at the bottom end
 * @param capSegments - Number of segments for the rounded caps (default 8)
 * @param radialSegments - Number of segments around the circumference (default 16)
 * @returns BufferGeometry centered on Y axis
 */
export function createTaperedCapsule(
  length: number,
  radiusTop: number,
  radiusBottom: number,
  capSegments: number = 8,
  radialSegments: number = 16
): BufferGeometry {
  const safeRadiusTop = Math.max(radiusTop, length * 0.045);
  const safeRadiusBottom = Math.max(radiusBottom, length * 0.045);

  // Create profile points for LatheGeometry (right side only, will be rotated)
  const points: Vector2[] = [];

  // Bottom cap (hemisphere)
  for (let i = 0; i <= capSegments; i++) {
    const angle = (i / capSegments) * (Math.PI / 2); // 0 to PI/2
    const x = safeRadiusBottom * Math.cos(angle);
    const y = -length / 2 + safeRadiusBottom * (1 - Math.sin(angle));
    points.push(new Vector2(x, y));
  }

  // Body (tapered cylinder) - just need top and bottom points
  // The bottom point is already added from the cap
  const bodyBottom = -length / 2 + safeRadiusBottom;
  const bodyTop = length / 2 - safeRadiusTop;

  // Add intermediate points for smooth taper
  const bodySteps = 4;
  for (let i = 1; i <= bodySteps; i++) {
    const t = i / bodySteps;
    const y = bodyBottom + t * (bodyTop - bodyBottom);
    const radius = safeRadiusBottom + t * (safeRadiusTop - safeRadiusBottom);
    points.push(new Vector2(radius, y));
  }

  // Top cap (hemisphere)
  for (let i = 0; i <= capSegments; i++) {
    const angle = (i / capSegments) * (Math.PI / 2); // 0 to PI/2
    const x = safeRadiusTop * Math.sin(angle);
    const y = length / 2 - safeRadiusTop + safeRadiusTop * Math.cos(angle);
    points.push(new Vector2(x, y));
  }

  // Create the lathe geometry
  const geometry = new LatheGeometry(points, radialSegments);
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Creates a smooth oval/egg-shaped head geometry.
 * Slightly taller than wide, with a subtle taper toward the jaw.
 *
 * @param width - Width of the head at widest point
 * @param height - Total height of the head
 * @param segments - Number of segments (default 32 for smoothness)
 * @returns BufferGeometry centered on Y axis
 */
export function createHeadGeometry(
  width: number,
  height: number,
  segments: number = 32,
  jawTaper: number = 0.86
): BufferGeometry {
  // Create egg-shaped profile using LatheGeometry
  const points: Vector2[] = [];
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  // Profile from bottom to top
  // Use an ellipse with taper at bottom (jaw)
  for (let i = 0; i <= segments; i++) {
    const t = i / segments; // 0 at bottom, 1 at top
    const angle = t * Math.PI; // 0 to PI

    // Base ellipse
    let x = halfWidth * Math.sin(angle);
    const y = -halfHeight * Math.cos(angle);

    // Add taper to bottom half (jaw is narrower)
    if (t < 0.4) {
      const taperFactor = jawTaper + (1 - jawTaper) * (t / 0.4);
      x *= taperFactor;
    }

    points.push(new Vector2(x, y));
  }

  const geometry = new LatheGeometry(points, segments);
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Creates a smooth torso geometry with anatomical curves.
 * Wider at shoulders, narrow at waist, slightly wider at hips.
 *
 * @param height - Total height of torso
 * @param shoulderHalfWidth - Half-width at shoulders (widest)
 * @param waistHalfWidth - Half-width at waist (narrowest)
 * @param hipHalfWidth - Half-width at hips
 * @param segments - Radial segments (default 32)
 * @returns BufferGeometry with bottom at Y=0
 */
export function createTorsoGeometry(
  height: number,
  shoulderHalfWidth: number,
  chestHalfWidth: number,
  waistHalfWidth: number,
  hipHalfWidth: number,
  segments: number = 32
): BufferGeometry {
  // Profile points from bottom (hips) to top (shoulders)
  const points: Vector2[] = [];

  // Control points along the torso (as percentage of height from bottom)
  const controlPoints = [
    { t: 0.0, width: hipHalfWidth * 0.95 }, // Hip bottom (slightly narrower)
    { t: 0.08, width: hipHalfWidth }, // Hip widest
    { t: 0.20, width: hipHalfWidth * 0.92 }, // Upper hip
    { t: 0.35, width: waistHalfWidth * 1.05 }, // Just below waist
    { t: 0.45, width: waistHalfWidth }, // Waist (narrowest)
    { t: 0.55, width: waistHalfWidth * 1.12 }, // Lower ribcage
    { t: 0.70, width: chestHalfWidth }, // Mid chest
    { t: 0.85, width: chestHalfWidth * 1.03 }, // Upper chest
    { t: 0.95, width: shoulderHalfWidth }, // Shoulder level
    { t: 1.0, width: shoulderHalfWidth * 0.9 }, // Neck base
  ];

  // Interpolate smooth curve through control points
  const numPoints = 24; // More points for smoother curve
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const y = t * height;

    // Find surrounding control points and interpolate
    let width = hipHalfWidth;
    for (let j = 0; j < controlPoints.length - 1; j++) {
      const p0 = controlPoints[j];
      const p1 = controlPoints[j + 1];
      if (t >= p0.t && t <= p1.t) {
        const localT = (t - p0.t) / (p1.t - p0.t);
        // Smooth step interpolation
        const smoothT = localT * localT * (3 - 2 * localT);
        width = p0.width + smoothT * (p1.width - p0.width);
        break;
      }
    }

    points.push(new Vector2(width, y));
  }

  const geometry = new LatheGeometry(points, segments);

  // Apply front/back asymmetry so torso looks human, not rotationally perfect.
  const positions = geometry.attributes.position;
  const isFemaleFrame = hipHalfWidth > shoulderHalfWidth;

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);

    const yNorm = Math.max(0, Math.min(1, y / height));
    const chestBand = Math.exp(-Math.pow((yNorm - 0.73) / 0.17, 2));
    const waistBand = Math.exp(-Math.pow((yNorm - 0.48) / 0.14, 2));
    const hipBand = Math.exp(-Math.pow((yNorm - 0.18) / 0.12, 2));

    const isFront = z >= 0;
    const frontScale = isFront ? (isFemaleFrame ? 1.12 : 1.08) : 1;
    const backScale = !isFront ? 0.86 : 1;

    let nextZ = z * frontScale * backScale;
    let nextX = x;

    if (isFront) {
      nextZ += (isFemaleFrame ? 0.024 : 0.018) * chestBand;
      nextZ += (isFemaleFrame ? 0.010 : 0.006) * waistBand;
      nextZ += (isFemaleFrame ? 0.014 : 0.008) * hipBand;
    } else {
      nextZ -= (isFemaleFrame ? 0.007 : 0.009) * chestBand;
      nextZ -= (isFemaleFrame ? 0.004 : 0.006) * hipBand;
    }

    nextX *= 1 + chestBand * (isFemaleFrame ? 0.01 : 0.02);
    nextX *= 1 - waistBand * (isFemaleFrame ? 0.05 : 0.035);
    nextX *= 1 + hipBand * (isFemaleFrame ? 0.06 : 0.012);

    positions.setXYZ(i, nextX, y, nextZ);
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Creates a smooth neck geometry that tapers from base to top.
 *
 * @param height - Height of the neck
 * @param radiusBottom - Radius at base (connects to torso)
 * @param radiusTop - Radius at top (connects to head)
 * @param segments - Radial segments (default 16)
 * @returns BufferGeometry with bottom at Y=0
 */
export function createNeckGeometry(
  height: number,
  radiusBottom: number,
  radiusTop: number,
  segments: number = 16
): BufferGeometry {
  const points: Vector2[] = [];

  // Simple tapered cylinder with slight curve
  const numPoints = 8;
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const y = t * height;

    // Smooth taper with slight inward curve at middle
    const baseRadius = radiusBottom + t * (radiusTop - radiusBottom);
    const curveFactor = 1 - Math.sin(t * Math.PI) * 0.05; // Slight inward curve
    const radius = baseRadius * curveFactor;

    points.push(new Vector2(radius, y));
  }

  const geometry = new LatheGeometry(points, segments);
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Creates a simple foot geometry.
 * Wedge shape with flat bottom, angled top.
 *
 * @param length - Length of foot (heel to toe)
 * @param width - Width of foot
 * @param height - Height at ankle
 * @param segments - Radial segments (default 16)
 * @returns BufferGeometry with bottom at Y=0
 */
export function createFootGeometry(
  length: number,
  width: number,
  height: number,
  segments: number = 16
): BufferGeometry {
  // Soft capsule-like foot to avoid robotic hard edges.
  const geometry = new CapsuleGeometry(0.5, 1, 6, Math.max(10, Math.floor(segments)));
  geometry.rotateZ(Math.PI / 2);
  geometry.scale(length / 2, height, width);
  geometry.translate(0, -height * 0.08, length * 0.06);
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Creates a simple mitten-style hand geometry.
 *
 * @param length - Length of hand
 * @param width - Width of hand
 * @param segments - Radial segments (default 12)
 * @returns BufferGeometry centered on Y axis
 */
export function createHandGeometry(
  length: number,
  width: number,
  segments: number = 12
): BufferGeometry {
  // Smooth palm + finger block to keep silhouette organic.
  const geometry = new CapsuleGeometry(0.5, 1, 6, Math.max(8, Math.floor(segments)));
  geometry.scale(width * 0.62, length * 0.52, width * 0.46);
  geometry.translate(0, -length * 0.04, width * 0.08);
  geometry.computeVertexNormals();

  return geometry;
}
