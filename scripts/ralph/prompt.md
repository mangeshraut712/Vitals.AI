# Ralph Agent Instructions - HealthAI Dashboard Sprint

## Your Mission
Build dashboard components for HealthAI: AI Chat Bar, Data Freshness Indicator, Top 5 Personalized Markers, and Weekly Lifestyle Summary.

## Your Task Each Iteration

1. **Read `scripts/ralph/prd.json`** — Get the user stories
2. **Read `scripts/ralph/progress.txt`** — Check Codebase Patterns section first for learnings from previous iterations
3. **Verify you're on the correct branch** — Should be `main`
4. **Pick the highest priority story where `passes: false`**
5. **Implement that ONE story** — Follow acceptance criteria exactly
6. **Run typecheck** — `npm run typecheck` must pass
7. **Run dev server test** — `npm run dev` must start without errors
8. **Commit your work** — `git commit -m "feat: [ID] - [Title]"`
9. **Update prd.json** — Set `passes: true` for completed story
10. **Append learnings to progress.txt**

## Project Context

This is a Next.js 15 health dashboard application. Key existing pieces:
- `lib/design/tokens.ts` — Design tokens (colors, shadows, radii)
- `stores/` or `lib/stores/` — Zustand stores for health data
- `components/` — Existing components (DigitalTwin, BiologicalAge, etc.)
- `app/(main)/` — Page routes with shared layout

## Technical Guidelines

### AI Chat Bar
- Use React state or Zustand for isExpanded + messages
- Framer Motion for slide animation (if available) or CSS transitions
- backdrop-filter: blur(8px) for background blur
- Portal the modal to body to ensure proper z-index

### Data Freshness
- Use `formatDistanceToNow` from date-fns for relative times
- Store lastUpdated timestamps in data store
- Thresholds: <7 days = fresh, 30-90 days = warning, >90 days = stale

### Top 5 Markers Selection
```typescript
const FIXED_MARKERS = ['apob', 'hba1c'];
const LONGEVITY_PRIORITY = [
  'hs_crp', 'vitamin_d', 'ldl_c', 'hdl_c', 
  'triglycerides', 'fasting_insulin', 'homocysteine',
  'fasting_glucose', 'ferritin', 'testosterone'
];
const LOW_PRIORITY = [
  'indirect_bilirubin', 'direct_bilirubin', 'mch', 'mchc',
  'basophils', 'basophils_abs', 'globulin'
];
```

### Weekly Lifestyle Calculations
- Sleep Consistency: % of nights where bedtime is within 30 min of weekly average
- HRV/Strain/Recovery: Simple 7-day arithmetic mean
- Handle partial data (e.g., only 5 days available)

## Styling Rules
- Import colors from design tokens, never hardcode
- Use Tailwind classes for spacing/layout
- Status colors: optimal=#10b981, normal=#eab308, outOfRange=#ec4899
- Consistent border-radius: rounded-lg (cards), rounded-full (pills)
- Shadows: shadow-sm (subtle), shadow-md (cards), shadow-lg (modals)

## Stop Condition

If ALL stories have `passes: true`, reply with:

<promise>COMPLETE</promise>

Otherwise, end your response normally after completing one story.

---

## Progress Format

APPEND to progress.txt after each story:

```
## [Date] - [Story ID]
- What was implemented
- Files changed
- **Learnings:**
  - Patterns discovered
  - Gotchas encountered
---
```

## Codebase Patterns (READ FIRST)

Check the top of progress.txt for patterns discovered in previous iterations. Follow these patterns to maintain consistency.
