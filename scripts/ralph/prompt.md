# HealthAI Digital Twin — Ralph Agent Instructions

You are building a 3D digital twin visualization for HealthAI. The twin is a procedural humanoid that reflects the user's health data through posture, coloring, and highlights.

## Before Each Task

1. Read `scripts/ralph/prd.json` — find highest priority story where `passes: false`
2. Read `scripts/ralph/progress.txt` — check Codebase Patterns section first
3. Read `AGENTS.md` — check for relevant patterns/gotchas
4. Understand the existing codebase before adding new code

## Your Workflow

For each story:

1. **Read the acceptance criteria** — understand exactly what "done" means
2. **Implement the feature** — write the code
3. **Run typecheck** — `npm run typecheck` must pass
4. **Test in browser** — `npm run dev` and verify visually
5. **Commit** — `git add . && git commit -m "feat(DT-XXX): [title]"`
6. **Update prd.json** — set `passes: true` for completed story
7. **Update progress.txt** — append learnings

## Key Technical Context

### Three.js + React Three Fiber Basics

```tsx
// Canvas is the root - everything 3D goes inside
<Canvas>
  <ambientLight intensity={0.5} />
  <directionalLight position={[10, 10, 5]} />
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="white" />
  </mesh>
  <OrbitControls />
</Canvas>
```

### Procedural Body Structure

Build the human from primitives in a hierarchy:

```
Body (Group)
├── Torso (CapsuleGeometry)
│   └── Chest reference for highlights
├── Neck (CylinderGeometry)
├── Head (SphereGeometry)
├── LeftArm (Group)
│   ├── UpperArm (CapsuleGeometry)
│   ├── Elbow (SphereGeometry) 
│   ├── Forearm (CapsuleGeometry)
│   └── Hand (SphereGeometry)
├── RightArm (Group) - mirror of left
├── LeftLeg (Group)
│   ├── Thigh (CapsuleGeometry)
│   ├── Knee (SphereGeometry)
│   ├── Shin (CapsuleGeometry)
│   └── Foot (BoxGeometry)
└── RightLeg (Group) - mirror of left
```

### Health → Visual Mappings

| Health Input | Visual Output |
|--------------|---------------|
| Sleep score < 60 | Fatigued posture (hunched) |
| HRV < 40ms | Low energy, slouched |
| Visceral fat > 1.5 lbs | Red glow on torso core |
| CRP > 2 mg/L | Orange glow on joints |
| Body fat > 25% (M) / 32% (F) | Slightly cooler skin tone |
| Good health overall | Upright, warm white, no highlights |

### Animation Pattern

```tsx
useFrame((state, delta) => {
  // Smooth interpolation
  meshRef.current.rotation.x = THREE.MathUtils.lerp(
    meshRef.current.rotation.x,
    targetRotation,
    delta * 3 // speed
  );
  
  // Breathing animation
  const breathe = Math.sin(state.clock.elapsedTime * 2) * 0.02;
  torsoRef.current.scale.y = 1 + breathe;
});
```

### Material Highlights

```tsx
// Normal state
<meshStandardMaterial color="#f5f5f5" />

// Highlighted (problem area)
<meshStandardMaterial 
  color="#f5f5f5" 
  emissive="#ff4400" 
  emissiveIntensity={0.5} 
/>
```

## File Locations

| What | Where |
|------|-------|
| User stories | `scripts/ralph/prd.json` |
| Progress log | `scripts/ralph/progress.txt` |
| Twin components | `components/digital-twin/` |
| Twin logic | `lib/digital-twin/` |
| Health data | `lib/store/health-data.ts` |

## Reference: Sample Health Data Structure

```typescript
// From HealthDataStore
{
  biomarkers: {
    glucose: 85,
    crp: 0.5,
    // ...
  },
  bodyComp: {
    bodyFatPercent: 18,
    visceralFat: 0.8,
    // ...
  },
  activity: {
    hrv: 55,
    sleepHours: 7.5,
    sleepScore: 78,
    // ...
  },
  phenoAge: {
    chronologicalAge: 35,
    biologicalAge: 31.2,
    delta: -3.8
  }
}
```

## Progress.txt Format

APPEND after completing each story:

```
---
## [Date] - [Story ID]: [Title]

**Implemented:**
- What was built

**Files created/changed:**
- path/to/file.ts

**Three.js learnings:**
- Patterns discovered
- Gotchas encountered

**Verified:**
- [ ] typecheck passes
- [ ] renders in browser
- [ ] visual looks correct
```

## Common Commands

```bash
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three
npm run typecheck
npm run dev
git add . && git commit -m "feat(DT-XXX): description"
```

## Stop Condition

When ALL stories in prd.json have `passes: true`, output:

```
<promise>COMPLETE</promise>
```

If stuck after 15+ iterations, output:

```
<promise>BLOCKED</promise>

Blocking issues:
- [List what's preventing completion]

Completed stories:
- [List completed story IDs]
```

## Critical Reminders

1. **Procedural model = code only** — No external model files needed
2. **Hierarchy matters** — Use Groups so rotations cascade (shoulder rotates → arm follows)
3. **Store refs** — Use useRef for meshes you need to animate/modify
4. **Test visually** — Check browser, not just typecheck
5. **One story at a time** — Complete fully before moving on
6. **Keep it white/minimal** — Match the mannequin reference aesthetic

## Do NOT

- Download external 3D models
- Skip visual verification
- Over-complicate the geometry (simple shapes work)
- Forget to dispose geometries if creating dynamically
- Block the main thread with heavy calculations

## Begin

Read `scripts/ralph/prd.json` now and start with DT-001.
