# HealthAI Digital Twin — Ralph Agent Instructions

You are building a **clean, professional 3D mannequin** for HealthAI. Think high-end store display mannequin: smooth, minimal, elegant, anatomically proportioned but abstract.

## Design Goal

**Reference:** Clean white mannequin like you see in clothing stores. Smooth continuous surfaces. No visible joints or seams. Subtle anatomical form without detail. Matte finish. Studio lit.

**NOT:** Blocky robot, visible spheres at joints, obvious primitive shapes, chunky proportions.

## Before Each Task

1. Read `scripts/ralph/prd.json` — find highest priority story where `passes: false`
2. Read `scripts/ralph/progress.txt` — check Codebase Patterns section
3. Understand existing code before adding new code

## Your Workflow

For each story:

1. **Read acceptance criteria** — understand what "done" means
2. **Implement** — write clean TypeScript code
3. **Typecheck** — `npm run typecheck` must pass
4. **Visual check** — `npm run dev` and verify in browser
5. **Commit** — `git add . && git commit -m "feat(DT-XXX): [title]"`
6. **Update prd.json** — set `passes: true`
7. **Update progress.txt** — append learnings

---

## Critical: Making Smooth Geometry

### Use LatheGeometry for Organic Shapes

LatheGeometry creates smooth rotational shapes from a 2D profile. PERFECT for torso, head, limbs.

```tsx
import { LatheGeometry, Vector2 } from 'three';

// Define profile points (half silhouette from center to edge)
const torsoProfile = [
  new Vector2(0.15, 0),      // hip width at bottom
  new Vector2(0.18, 0.15),   // hip curve
  new Vector2(0.13, 0.35),   // waist (narrowest)
  new Vector2(0.20, 0.55),   // ribcage
  new Vector2(0.22, 0.70),   // shoulder (top)
];

// Create smooth rotational geometry
const torsoGeometry = new LatheGeometry(torsoProfile, 32); // 32 segments for smoothness
```

### Tapered Limbs

For arms/legs, create tapered capsule shapes:

```tsx
// Custom tapered limb with rounded ends
function createTaperedLimb(length: number, radiusTop: number, radiusBottom: number) {
  const profile = [
    new Vector2(0, 0),
    new Vector2(radiusBottom, 0),
    new Vector2(radiusBottom, length * 0.1),
    new Vector2(radiusTop, length * 0.9),
    new Vector2(radiusTop, length),
    new Vector2(0, length),
  ];
  return new LatheGeometry(profile, 16);
}
```

### Hide Seams with Overlapping

**Key technique:** Parts should overlap INTO each other slightly.

```tsx
// Neck overlaps into head and torso
<group position={[0, torsoTop - 0.02, 0]}>  {/* Penetrates torso by 0.02 */}
  <mesh geometry={neckGeometry}>
    {/* Neck top at headBottom + 0.02 */}
  </mesh>
</group>
```

### Smooth Joints

Instead of visible spheres at joints, use:
1. Tapered ends on limbs that blend together
2. Overlapping geometry
3. Or: small spheres that are INSIDE the mesh, not visible

---

## Proportions System

All measurements in world units. Total figure height: ~2.1 units.

```
Head:       0.28 tall, 0.20 wide
Neck:       0.08 tall, 0.06 radius
Torso:      0.70 tall, shoulders 0.45 wide, waist 0.30, hips 0.35
Upper arm:  0.36 long, 0.045→0.035 radius
Forearm:    0.30 long, 0.035→0.025 radius
Hand:       0.18 long
Thigh:      0.50 long, 0.065→0.045 radius
Shin:       0.48 long, 0.045→0.030 radius
Foot:       0.25 long, 0.09 wide
```

Stack from ground up:
- Feet at Y=0 (ground)
- Leg total ~0.98 (foot + shin + thigh)
- Torso bottom at ~0.98
- Torso top at ~1.68
- Neck at ~1.68
- Head bottom at ~1.76
- Head top at ~2.04

---

## Material Setup

```tsx
// Clean matte white
const baseMaterial = new MeshStandardMaterial({
  color: '#fafafa',
  roughness: 0.85,  // Matte, not shiny
  metalness: 0,
});

// Highlighted (problem area)
const highlightMaterial = new MeshStandardMaterial({
  color: '#fafafa',
  roughness: 0.85,
  metalness: 0,
  emissive: '#ff6b35',
  emissiveIntensity: 0.4,
});
```

---

## Body Part Hierarchy

```
<group ref={bodyRef}>
  <Torso />
  <Neck />
  <Head />
  
  <group ref={leftArmRef}>  {/* For shoulder rotation */}
    <Arm side="left" />
  </group>
  
  <group ref={rightArmRef}>
    <Arm side="right" />
  </group>
  
  <group ref={leftLegRef}>  {/* For hip rotation */}
    <Leg side="left" />
  </group>
  
  <group ref={rightLegRef}>
    <Leg side="right" />
  </group>
</group>
```

Use groups so rotations cascade (rotate shoulder → whole arm moves).

---

## Animation Pattern

```tsx
import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';

function AnimatedBody({ targetPosture }) {
  const spineRef = useRef();
  const currentRotation = useRef(0);
  
  useFrame((state, delta) => {
    // Smooth interpolation to target
    currentRotation.current = MathUtils.lerp(
      currentRotation.current,
      targetPosture.spine,
      delta * 3  // Speed
    );
    spineRef.current.rotation.x = currentRotation.current;
    
    // Breathing
    const breathe = Math.sin(state.clock.elapsedTime * 0.5) * 0.012;
    torsoRef.current.scale.y = 1 + breathe;
  });
}
```

---

## File Structure

```
components/digital-twin/
├── TwinCanvas.tsx          # Canvas, lights, camera
├── ProceduralHuman.tsx     # Assembles body parts
├── DigitalTwin.tsx         # Wrapper, connects to health data
└── body-parts/
    ├── Torso.tsx
    ├── Head.tsx
    ├── Neck.tsx
    ├── Arm.tsx
    └── Leg.tsx

lib/digital-twin/
├── proportions.ts          # Body measurements
├── geometry.ts             # Geometry helpers
├── materials.ts            # Material factory
├── types.ts                # BodyState interface
├── mapper.ts               # Health → BodyState
├── posture.ts              # Posture rotations
├── highlights.ts           # Highlight logic
└── vitality.ts             # Skin tone logic
```

---

## Common Commands

```bash
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three
npm run typecheck
npm run dev
git add . && git commit -m "feat(DT-XXX): description"
```

---

## Stop Conditions

When ALL stories pass:
```
<promise>COMPLETE</promise>
```

If stuck after 15+ iterations:
```
<promise>BLOCKED</promise>

Blocking issues:
- [What's preventing completion]
```

---

## Critical Reminders

1. **Smooth shapes** — Use LatheGeometry, not primitive cylinders
2. **Hide seams** — Overlap parts into each other
3. **Proportions matter** — Reference the measurements, don't eyeball
4. **32 segments minimum** — For smooth curved surfaces
5. **Test visually** — Typecheck isn't enough, look at it
6. **One story at a time** — Complete fully before moving on

## Do NOT

- Use raw CylinderGeometry for body parts (too blocky)
- Leave visible gaps between parts
- Make joints obvious spheres
- Skip visual verification
- Ignore proportions

## Begin

Read `scripts/ralph/prd.json` and start with DT-001.
