import { HEALTH_TOOL_NAMES, type HealthToolName } from '@/lib/agent/tool-names';

const BIOMARKER_HINTS = [
  'crp',
  'ldl',
  'hdl',
  'glucose',
  'hba1c',
  'a1c',
  'albumin',
  'ferritin',
  'vitamin',
  'triglyceride',
  'cholesterol',
  'tsh',
  'insulin',
  'biomarker',
  'bloodwork',
  'lab',
  'marker',
];

const RECOVERY_HINTS = [
  'sleep',
  'hrv',
  'recovery',
  'strain',
  'steps',
  'resting',
  'rhr',
  'whoop',
  'oura',
  'wearable',
];

const SCORECARD_HINTS = [
  'score',
  'phenoage',
  'pheno age',
  'biological age',
  'bio age',
  'overall',
  'scorecard',
  'how healthy',
];

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

/**
 * Deterministic tool router used for Pages demo, offline fallback, and evals.
 * Live OpenRouter calls still let the model choose tools; this is the ground-truth policy.
 */
export function selectToolsForQuery(query: string): HealthToolName[] {
  const haystack = query.toLowerCase().trim();
  if (!haystack) return [];

  const selected = new Set<HealthToolName>();
  const asksInsights =
    haystack.includes('insight') ||
    haystack.includes('overview') ||
    haystack.includes('summary') ||
    haystack.includes('how am i') ||
    haystack.includes('key health');

  if (asksInsights) {
    for (const name of HEALTH_TOOL_NAMES) selected.add(name);
    return [...selected];
  }

  if (includesAny(haystack, BIOMARKER_HINTS)) selected.add('lookupBiomarker');
  if (includesAny(haystack, RECOVERY_HINTS)) selected.add('getRecoverySnapshot');
  if (includesAny(haystack, SCORECARD_HINTS)) selected.add('getHealthScorecard');

  return HEALTH_TOOL_NAMES.filter((name) => selected.has(name));
}

export function defaultInputForTool(name: HealthToolName, query: string): unknown {
  switch (name) {
    case 'lookupBiomarker': {
      const compact = query.toLowerCase();
      if (compact.includes('crp')) return { query: 'CRP' };
      if (compact.includes('ldl')) return { query: 'LDL' };
      if (compact.includes('glucose')) return { query: 'glucose' };
      if (compact.includes('hba1c') || compact.includes('a1c')) return { query: 'HbA1c' };
      if (compact.includes('sleep') || compact.includes('insight') || compact.includes('summary')) {
        return { query: 'summary' };
      }
      return { query: query.trim() || 'summary' };
    }
    case 'getRecoverySnapshot':
      return { days: 7 };
    case 'getHealthScorecard':
      return { includeBreakdown: true };
    default: {
      const exhaustive: never = name;
      throw new Error(`Unhandled tool default input: ${String(exhaustive)}`);
    }
  }
}
