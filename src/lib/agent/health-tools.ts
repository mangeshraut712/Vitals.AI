import { BIOMARKER_REFERENCES, getBiomarkerStatus, type BiomarkerStatus } from '@/lib/types/health';
import { calculateHealthScore } from '@/lib/calculations/health-score';
import { isEmptySnapshot, type HealthSnapshot } from '@/lib/agent/health-snapshot';
import { assertNever, type HealthToolName } from '@/lib/agent/tool-names';
import { z } from 'zod';

export const LookupBiomarkerInputSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe('Biomarker name or key such as CRP, LDL, glucose, or "summary" for flagged markers'),
});

export const RecoverySnapshotInputSchema = z.object({
  days: z.number().int().min(1).max(30).optional().describe('Lookback window in days. Defaults to 7.'),
});

export const HealthScorecardInputSchema = z.object({
  includeBreakdown: z
    .boolean()
    .optional()
    .describe('When true, include weighted score components.'),
});

export interface MetricRow {
  label: string;
  value: string;
  tone: 'default' | 'good' | 'warn' | 'bad';
}

export interface ToolExecutionResult {
  tool: HealthToolName;
  empty: boolean;
  summary: string;
  metrics: MetricRow[];
  data: Record<string, unknown>;
}

function toneFromStatus(status: BiomarkerStatus): MetricRow['tone'] {
  switch (status) {
    case 'optimal':
      return 'good';
    case 'normal':
      return 'default';
    case 'borderline':
      return 'warn';
    case 'out_of_range':
      return 'bad';
    default:
      return assertNever(status, 'Unhandled biomarker status');
  }
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function biomarkerEntries(snapshot: HealthSnapshot): Array<{ key: string; value: number; label: string; unit: string }> {
  const rows: Array<{ key: string; value: number; label: string; unit: string }> = [];
  for (const [key, value] of Object.entries(snapshot.biomarkers)) {
    if (key === 'all' || key === 'patientAge' || typeof value !== 'number') continue;
    const ref = BIOMARKER_REFERENCES[key];
    rows.push({
      key,
      value,
      label: ref?.displayName ?? key,
      unit: ref?.unit ?? '',
    });
  }
  return rows;
}

export function lookupBiomarker(
  snapshot: HealthSnapshot,
  input: z.infer<typeof LookupBiomarkerInputSchema>
): ToolExecutionResult {
  const rows = biomarkerEntries(snapshot);
  if (rows.length === 0) {
    return {
      tool: 'lookupBiomarker',
      empty: true,
      summary: 'No biomarker files are loaded. Sync a lab PDF locally, or use the sample demo panel.',
      metrics: [],
      data: { query: input.query, matches: [] },
    };
  }

  const q = normalize(input.query);
  const wantsSummary = q === 'summary' || q === 'all' || q === 'insights' || q === 'keyinsights';
  const scored = rows.map((row) => ({
    ...row,
    status: getBiomarkerStatus(row.key, row.value),
  }));
  const matches = wantsSummary
    ? scored.filter((row) => row.status === 'borderline' || row.status === 'out_of_range').slice(0, 6)
    : scored.filter((row) => {
        const hay = `${normalize(row.key)}${normalize(row.label)}`;
        return hay.includes(q) || q.includes(normalize(row.key)) || q.includes(normalize(row.label));
      });

  const resolved = (wantsSummary ? matches : matches.slice(0, 5)).map((row) => {
    const ref = BIOMARKER_REFERENCES[row.key];
    const optimal = ref?.optimal
      ? `${ref.optimal.min ?? '…'}–${ref.optimal.max ?? '…'} ${row.unit}`.replace('…–…', 'see reference')
      : null;
    return {
      key: row.key,
      label: row.label,
      value: row.value,
      unit: row.unit,
      status: row.status,
      optimalRange: optimal,
    };
  });

  if (resolved.length === 0) {
    return {
      tool: 'lookupBiomarker',
      empty: true,
      summary: `No marker matched “${input.query}”. Try CRP, LDL, glucose, or summary.`,
      metrics: [],
      data: { query: input.query, matches: [] },
    };
  }

  return {
    tool: 'lookupBiomarker',
    empty: false,
    summary: wantsSummary
      ? `Flagged ${resolved.length} marker${resolved.length === 1 ? '' : 's'} against longevity ranges.`
      : `Found ${resolved.length} marker${resolved.length === 1 ? '' : 's'} for “${input.query}”.`,
    metrics: resolved.map((row) => ({
      label: row.label,
      value: `${row.value}${row.unit ? ` ${row.unit}` : ''} (${row.status.replace('_', ' ')})`,
      tone: toneFromStatus(row.status),
    })),
    data: { query: input.query, matches: resolved },
  };
}

export function getRecoverySnapshot(
  snapshot: HealthSnapshot,
  input: z.infer<typeof RecoverySnapshotInputSchema> = {}
): ToolExecutionResult {
  const days = input.days ?? 7;
  const window = snapshot.activity.slice(-days);
  if (window.length === 0) {
    return {
      tool: 'getRecoverySnapshot',
      empty: true,
      summary: 'No wearable activity is loaded. Import Whoop, Oura, Apple Health, or Fitbit locally.',
      metrics: [],
      data: { days, samples: 0 },
    };
  }

  const avg = (pick: (row: (typeof window)[number]) => number | undefined): number | null => {
    const values = window.map(pick).filter((value): value is number => typeof value === 'number');
    if (values.length === 0) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };

  const hrv = avg((row) => row.hrv);
  const rhr = avg((row) => row.rhr);
  const sleep = avg((row) => row.sleepHours);
  const recovery = avg((row) => row.recovery);
  const steps = avg((row) => row.steps);

  const metrics: MetricRow[] = [];
  if (hrv !== null) {
    metrics.push({
      label: 'HRV',
      value: `${hrv.toFixed(0)} ms`,
      tone: hrv >= 55 ? 'good' : hrv >= 40 ? 'default' : 'warn',
    });
  }
  if (sleep !== null) {
    metrics.push({
      label: 'Sleep',
      value: `${sleep.toFixed(1)} h`,
      tone: sleep >= 7 && sleep <= 9 ? 'good' : sleep >= 6 ? 'warn' : 'bad',
    });
  }
  if (rhr !== null) {
    metrics.push({
      label: 'Resting HR',
      value: `${rhr.toFixed(0)} bpm`,
      tone: rhr < 60 ? 'good' : rhr < 80 ? 'default' : 'warn',
    });
  }
  if (recovery !== null) {
    metrics.push({
      label: 'Recovery',
      value: `${recovery.toFixed(0)}%`,
      tone: recovery >= 75 ? 'good' : recovery >= 60 ? 'default' : 'warn',
    });
  }
  if (steps !== null) {
    metrics.push({
      label: 'Steps',
      value: Math.round(steps).toLocaleString(),
      tone: steps >= 8000 ? 'good' : steps >= 5000 ? 'default' : 'warn',
    });
  }

  return {
    tool: 'getRecoverySnapshot',
    empty: false,
    summary: `${window.length}-day recovery from ${snapshot.activitySource === 'unknown' ? 'activity files' : snapshot.activitySource}.`,
    metrics,
    data: {
      days,
      samples: window.length,
      source: snapshot.activitySource,
      averages: { hrv, rhr, sleep, recovery, steps },
    },
  };
}

export function getHealthScorecard(
  snapshot: HealthSnapshot,
  input: z.infer<typeof HealthScorecardInputSchema> = {}
): ToolExecutionResult {
  if (isEmptySnapshot(snapshot)) {
    return {
      tool: 'getHealthScorecard',
      empty: true,
      summary: 'Scorecard needs lab or wearable data. Sync files locally to compute PhenoAge and the composite score.',
      metrics: [],
      data: {},
    };
  }

  const score = calculateHealthScore(snapshot.biomarkers, snapshot.phenoAge, snapshot.activity);
  const metrics: MetricRow[] = [
    {
      label: 'Health score',
      value: `${score.score} (${score.label})`,
      tone: score.score >= 80 ? 'good' : score.score >= 60 ? 'default' : 'warn',
    },
  ];

  if (snapshot.chronologicalAge !== null) {
    metrics.push({
      label: 'Chronological age',
      value: `${snapshot.chronologicalAge}y`,
      tone: 'default',
    });
  }
  if (snapshot.phenoAge) {
    const younger = snapshot.phenoAge.delta < 0;
    metrics.push({
      label: 'PhenoAge',
      value: `${snapshot.phenoAge.phenoAge}y (${snapshot.phenoAge.delta >= 0 ? '+' : ''}${snapshot.phenoAge.delta}y)`,
      tone: younger ? 'good' : snapshot.phenoAge.delta <= 2 ? 'warn' : 'bad',
    });
  } else {
    metrics.push({
      label: 'PhenoAge',
      value: 'Incomplete Levine panel',
      tone: 'warn',
    });
  }

  if (input.includeBreakdown) {
    metrics.push({
      label: 'Biomarker component',
      value: String(score.breakdown.biomarkerScore),
      tone: 'default',
    });
    metrics.push({
      label: 'Age component',
      value: String(score.breakdown.ageScore),
      tone: 'default',
    });
    metrics.push({
      label: 'Activity component',
      value: String(score.breakdown.activityScore),
      tone: 'default',
    });
  }

  return {
    tool: 'getHealthScorecard',
    empty: false,
    summary: `Composite score ${score.score}/100 with ${score.breakdown.outOfRangeCount} out-of-range markers.`,
    metrics,
    data: {
      score: score.score,
      label: score.label,
      status: score.status,
      phenoAge: snapshot.phenoAge,
      chronologicalAge: snapshot.chronologicalAge,
      breakdown: score.breakdown,
    },
  };
}

export function executeHealthTool(
  name: HealthToolName,
  rawInput: unknown,
  snapshot: HealthSnapshot
): ToolExecutionResult {
  switch (name) {
    case 'lookupBiomarker':
      return lookupBiomarker(snapshot, LookupBiomarkerInputSchema.parse(rawInput ?? { query: 'summary' }));
    case 'getRecoverySnapshot':
      return getRecoverySnapshot(snapshot, RecoverySnapshotInputSchema.parse(rawInput ?? {}));
    case 'getHealthScorecard':
      return getHealthScorecard(snapshot, HealthScorecardInputSchema.parse(rawInput ?? {}));
    default:
      return assertNever(name, 'Unhandled health tool');
  }
}

export interface MockToolCall {
  name: HealthToolName;
  input?: unknown;
}

export function applyMockedToolCalls(
  calls: MockToolCall[],
  snapshot: HealthSnapshot
): ToolExecutionResult[] {
  return calls.map((call) => executeHealthTool(call.name, call.input, snapshot));
}
