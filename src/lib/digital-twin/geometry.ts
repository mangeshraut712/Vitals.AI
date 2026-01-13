/**
 * Geometry utilities for creating smooth, organic body shapes.
 *
 * Uses LatheGeometry for rotational symmetry shapes (limbs, torso).
 * All geometries are centered on the Y axis.
 */

import { LatheGeometry, Vector2, BufferGeometry, SphereGeometry } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

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
  // Calculate the body length (excluding caps)
  const capHeight = Math.max(radiusTop, radiusBottom);
  const bodyLength = Math.max(0, length - capHeight * 2);

  // Create profile points for LatheGeometry (right side only, will be rotated)
  const points: Vector2[] = [];

  // Bottom cap (hemisphere)
  for (let i = 0; i <= capSegments; i++) {
    const angle = (i / capSegments) * (Math.PI / 2); // 0 to PI/2
    const x = radiusBottom * Math.cos(angle);
    const y = -length / 2 + radiusBottom * (1 - Math.sin(angle));
    points.push(new Vector2(x, y));
  }

  // Body (tapered cylinder) - just need top and bottom points
  // The bottom point is already added from the cap
  const bodyBottom = -length / 2 + radiusBottom;
  const bodyTop = length / 2 - radiusTop;

  // Add intermediate points for smooth taper
  const bodySteps = 4;
  for (let i = 1; i <= bodySteps; i++) {
    const t = i / bodySteps;
    const y = bodyBottom + t * (bodyTop - bodyBottom);
    const radius = radiusBottom + t * (radiusTop - radiusBottom);
    points.push(new Vector2(radius, y));
  }

  // Top cap (hemisphere)
  for (let i = 0; i <= capSegments; i++) {
    const angle = (i / capSegments) * (Math.PI / 2); // 0 to PI/2
    const x = radiusTop * Math.sin(angle);
    const y = length / 2 - radiusTop + radiusTop * Math.cos(angle);
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
  segments: number = 32
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
      const taperFactor = 0.85 + 0.15 * (t / 0.4); // 0.85 at bottom, 1.0 at t=0.4
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
    { t: 0.55, width: waistHalfWidth * 1.1 }, // Lower ribcage
    { t: 0.70, width: shoulderHalfWidth * 0.85 }, // Mid chest
    { t: 0.85, width: shoulderHalfWidth * 0.95 }, // Upper chest
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
  // Use a custom profile for the foot - it's not radially symmetric
  // but we can approximate with a tapered shape
  const points: Vector2[] = [];

  // Foot profile (side view, rotated around Z axis conceptually)
  // We'll use a modified capsule shape
  const halfWidth = width / 2;

  // Bottom is flat (just a small curve for realism)
  points.push(new Vector2(halfWidth * 0.3, 0));
  points.push(new Vector2(halfWidth * 0.9, 0.01));
  points.push(new Vector2(halfWidth, height * 0.15));
  points.push(new Vector2(halfWidth * 0.95, height * 0.5));
  points.push(new Vector2(halfWidth * 0.7, height * 0.85));
  points.push(new Vector2(halfWidth * 0.4, height));
  points.push(new Vector2(0, height));

  const geometry = new LatheGeometry(points, segments);
  geometry.computeVertexNormals();

  // Scale to match length
  geometry.scale(length / width, 1, 1);

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
  const points: Vector2[] = [];
  const halfWidth = width / 2;
  const halfLength = length / 2;

  // Mitten shape profile
  // Bottom (wrist end)
  points.push(new Vector2(0, -halfLength));
  points.push(new Vector2(halfWidth * 0.7, -halfLength + 0.02));
  points.push(new Vector2(halfWidth * 0.85, -halfLength + 0.04));

  // Palm
  points.push(new Vector2(halfWidth, -halfLength * 0.3));
  points.push(new Vector2(halfWidth * 0.95, 0));

  // Fingers (tapered tip)
  points.push(new Vector2(halfWidth * 0.85, halfLength * 0.5));
  points.push(new Vector2(halfWidth * 0.6, halfLength * 0.8));
  points.push(new Vector2(halfWidth * 0.3, halfLength * 0.95));
  points.push(new Vector2(0, halfLength));

  const geometry = new LatheGeometry(points, segments);
  geometry.computeVertexNormals();

  return geometry;
}
