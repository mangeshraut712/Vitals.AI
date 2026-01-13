# HealthAI UX Polish — Ralph Agent Instructions

You are redesigning HealthAI with a clean, modern UI inspired by InsideTracker. Focus on polish, consistency, and user-friendly data visualization.

## Design Principles

1. **Clean and minimal** — Soft shadows, rounded corners, plenty of whitespace
2. **Consistent color coding** — Green (optimal), Yellow (normal), Pink/Red (out of range)
3. **Good typography** — Clear hierarchy, readable sizes
4. **Data-forward** — Numbers and status are prominent, not hidden
5. **Polished but not flashy** — Professional health dashboard, not a gaming UI

## Color System

```typescript
// Use these consistently everywhere
const colors = {
  // Status colors
  optimal: '#10b981',      // Green
  normal: '#eab308',       // Yellow  
  outOfRange: '#ec4899',   // Pink
  
  // Backgrounds
  page: '#f8fafc',
  card: '#ffffff',
  
  // Text
  primary: '#0f172a',
  secondary: '#64748b',
  muted: '#94a3b8',
};
```

## Before Each Task

1. Read `scripts/ralph/prd.json` — find highest priority story where `passes: false`
2. Read `scripts/ralph/progress.txt` — check patterns
3. Review existing components before creating new ones

## Your Workflow

For each story:

1. **Read acceptance criteria**
2. **Implement** — write clean TypeScript/React code
3. **Typecheck** — `npm run typecheck` must pass
4. **Visual check** — `npm run dev` and verify in browser
5. **Commit** — `git add . && git commit -m "feat(UX-XXX): [title]"`
6. **Update prd.json** — set `passes: true`
7. **Update progress.txt** — append learnings

## File Structure

```
app/
├── (main)/
│   ├── layout.tsx           # Shared layout with tab nav
│   ├── dashboard/
│   │   └── page.tsx
│   ├── biomarkers/
│   │   └── page.tsx
│   ├── goals/
│   │   └── page.tsx
│   └── data-sources/
│       └── page.tsx

components/
├── layout/
│   └── TabNav.tsx
├── dashboard/
│   ├── HealthScoreCard.tsx
│   ├── BiologicalAgeCard.tsx
│   └── QuickStatCard.tsx
├── biomarkers/
│   ├── BiomarkerSummary.tsx
│   ├── BiomarkerTable.tsx
│   └── BiomarkerFilters.tsx
├── goals/
│   └── GoalCard.tsx
├── charts/
│   └── Sparkline.tsx
└── ui/
    └── (shadcn components)

lib/
├── design/
│   └── tokens.ts
├── calculations/
│   └── health-score.ts
└── analysis/
    └── goals.ts
```

## Component Patterns

### Status Badge
```tsx
function StatusBadge({ status }: { status: 'optimal' | 'normal' | 'outOfRange' }) {
  const colors = {
    optimal: 'bg-emerald-100 text-emerald-700',
    normal: 'bg-yellow-100 text-yellow-700',
    outOfRange: 'bg-pink-100 text-pink-700',
  };
  const labels = {
    optimal: 'Optimal',
    normal: 'Normal',
    outOfRange: 'Out of Range',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
      {labels[status]}
    </span>
  );
}
```

### Card Container
```tsx
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
      {children}
    </div>
  );
}
```

### Gradient Goal Card
```tsx
// High priority: warm gradient
<div className="bg-gradient-to-br from-red-400 to-orange-500 rounded-xl p-6 text-white">

// Medium priority: amber gradient  
<div className="bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl p-6 text-white">

// Low priority: cool gradient
<div className="bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl p-6 text-white">
```

## Tab Navigation

```tsx
// app/(main)/layout.tsx
export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-8">
            <TabLink href="/dashboard">Dashboard</TabLink>
            <TabLink href="/biomarkers">Biomarkers</TabLink>
            <TabLink href="/goals">Goals</TabLink>
            <TabLink href="/data-sources">Data Sources</TabLink>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
```

## Sparkline Pattern

```tsx
import { LineChart, Line, ReferenceBand, ResponsiveContainer } from 'recharts';

function Sparkline({ data, min, max, current, status }) {
  return (
    <div className="w-32 h-10">
      <ResponsiveContainer>
        <LineChart data={data}>
          {/* Optimal range band */}
          <ReferenceBand y1={min} y2={max} fill="#10b981" fillOpacity={0.2} />
          {/* Trend line */}
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={statusColors[status]}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

## Health Score Formula

```typescript
function calculateHealthScore(healthData): { score: number; breakdown: object } {
  // Biomarkers: 50% weight
  const totalMarkers = Object.keys(healthData.biomarkers).length;
  const optimalMarkers = countOptimal(healthData.biomarkers);
  const biomarkerScore = (optimalMarkers / totalMarkers) * 100;
  
  // Age delta: 30% weight (negative delta = good)
  // -10 years = 100, 0 = 50, +10 years = 0
  const ageDelta = healthData.phenoAge?.delta || 0;
  const ageScore = Math.max(0, Math.min(100, 50 - (ageDelta * 5)));
  
  // Activity: 20% weight
  const activityScore = calculateActivityScore(healthData.activity);
  
  const total = (biomarkerScore * 0.5) + (ageScore * 0.3) + (activityScore * 0.2);
  
  return {
    score: Math.round(total),
    breakdown: { biomarkerScore, ageScore, activityScore }
  };
}
```

## Common Commands

```bash
npm run typecheck
npm run dev
npx shadcn@latest add [component]  # If need new shadcn components
git add . && git commit -m "feat(UX-XXX): description"
```

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

## Critical Reminders

1. **Use design tokens** — Don't hardcode colors
2. **Consistent spacing** — p-6 for cards, gap-6 between sections
3. **Status colors everywhere** — Green/yellow/pink for all health indicators
4. **Test visually** — Look at it in the browser, not just typecheck
5. **Mobile not required** — Focus on 1280px+ laptop screens

## Do NOT

- Use random colors (stick to the palette)
- Create inconsistent spacing
- Skip visual verification
- Over-engineer (simple is better)
- Forget to wire to real data

## Begin

Read `scripts/ralph/prd.json` and start with UX-001.
