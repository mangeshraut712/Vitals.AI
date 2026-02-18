import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { BodyComposition } from './body-comp';
import { getOpenRouterHeaders } from '@/lib/runtime/deployment';

/**
 * Extended body composition data extracted from DEXA scans
 * Supports any DEXA format (BodySpec, DexaFit, hospital scans, etc.)
 */
export interface ExtendedBodyComposition extends BodyComposition {
  // Additional bone data not always present in baseline parser
  hipBmd?: number;
}

const DEFAULT_EXTRACTION_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';

const SYSTEM_PROMPT = `You are a DEXA scan data extraction assistant. Extract body composition values from DEXA scan reports.

IMPORTANT RULES:
- Extract ALL values that are present in the report.
- Use exact numeric values from the report text. Do not do unit conversion.
- Return only keys that exist in the report.
- Return ONLY valid JSON.

Common terms to map:
- Total Body Fat % / Body Fat Percentage -> bodyFatPercent
- Lean Tissue / Lean Mass -> leanMass
- Fat Tissue / Fat Mass -> fatMass
- BMC / Bone Mineral Content -> boneMineralContent
- VAT / Visceral Adipose Tissue -> vatMass
- RMR -> restingMetabolicRate
- Android / Gynoid / A/G Ratio -> androidFatPercent, gynoidFatPercent, agRatio`;

const NUMERIC_KEYS = [
  'bodyFatPercent',
  'leanMass',
  'fatMass',
  'boneMineralContent',
  'totalMass',
  'height',
  'armsFatPercent',
  'legsFatPercent',
  'trunkFatPercent',
  'androidFatPercent',
  'gynoidFatPercent',
  'agRatio',
  'armsLeanMass',
  'legsLeanMass',
  'trunkLeanMass',
  'armsFatMass',
  'legsFatMass',
  'trunkFatMass',
  'androidFatMass',
  'gynoidFatMass',
  'visceralFat',
  'vatMass',
  'vatVolume',
  'totalBmd',
  'spineBmd',
  'hipBmd',
  'boneDensityTScore',
  'boneDensityZScore',
  'restingMetabolicRate',
  'almi',
  'rightArmLean',
  'leftArmLean',
  'rightLegLean',
  'leftLegLean',
] as const satisfies ReadonlyArray<keyof ExtendedBodyComposition>;

const STRING_KEYS = ['scanDate'] as const satisfies ReadonlyArray<
  keyof ExtendedBodyComposition
>;

const KEY_ALIASES: Record<string, keyof ExtendedBodyComposition> = {
  bodyfat: 'bodyFatPercent',
  bodyfatpercent: 'bodyFatPercent',
  bodyfatpercentage: 'bodyFatPercent',
  totalleanmass: 'leanMass',
  leanmass: 'leanMass',
  totalfatmass: 'fatMass',
  fatmass: 'fatMass',
  bmc: 'boneMineralContent',
  bonemineralcontent: 'boneMineralContent',
  weight: 'totalMass',
  bodyweight: 'totalMass',
  visceralfat: 'visceralFat',
  vat: 'vatMass',
  vatmass: 'vatMass',
  vatvolume: 'vatVolume',
  totalbmd: 'totalBmd',
  spinebmd: 'spineBmd',
  hipbmd: 'hipBmd',
  bonedensitytscore: 'boneDensityTScore',
  bonedensityzscore: 'boneDensityZScore',
  rmr: 'restingMetabolicRate',
  restingmetabolicrate: 'restingMetabolicRate',
  agratio: 'agRatio',
  scandate: 'scanDate',
};

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function createCanonicalKeyMap(): Record<string, keyof ExtendedBodyComposition> {
  const map: Record<string, keyof ExtendedBodyComposition> = { ...KEY_ALIASES };
  for (const key of NUMERIC_KEYS) {
    map[normalizeKey(key)] = key;
  }
  for (const key of STRING_KEYS) {
    map[normalizeKey(key)] = key;
  }
  map.sex = 'sex';
  return map;
}

const CANONICAL_KEY_MAP = createCanonicalKeyMap();

function parseModelList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);
}

function getModelCandidates(): string[] {
  const preferred = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_EXTRACTION_MODEL;
  const fallbackFromEnv = parseModelList(process.env.OPENROUTER_FALLBACK_MODELS);
  return Array.from(new Set([preferred, ...fallbackFromEnv]));
}

function extractJsonObjectFromText(value: string): string | null {
  const fencedMatch = value.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = value.indexOf('{');
  const lastBrace = value.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
    return null;
  }

  return value.slice(firstBrace, lastBrace + 1).trim();
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.replace(/,/g, '').trim();
  const match = normalized.match(/-?\d+(\.\d+)?/);
  if (!match) {
    return undefined;
  }

  const parsed = Number.parseFloat(match[0]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toSex(value: unknown): ExtendedBodyComposition['sex'] | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'male' || normalized === 'm') return 'male';
  if (normalized === 'female' || normalized === 'f') return 'female';
  return undefined;
}

function hasBodyCompValues(value: ExtendedBodyComposition): boolean {
  return Object.values(value).some((entry) => entry !== undefined);
}

function sanitizeBodyComp(input: unknown): ExtendedBodyComposition {
  if (!input || typeof input !== 'object') {
    return {};
  }

  const source = input as Record<string, unknown>;
  const result: ExtendedBodyComposition = {};
  const numericSet = new Set<string>(NUMERIC_KEYS as readonly string[]);
  const stringSet = new Set<string>(STRING_KEYS as readonly string[]);

  for (const [rawKey, rawValue] of Object.entries(source)) {
    const canonical = CANONICAL_KEY_MAP[normalizeKey(rawKey)];
    if (!canonical) {
      continue;
    }

    const key = canonical as string;

    if (key === 'sex') {
      const sex = toSex(rawValue);
      if (sex) {
        result.sex = sex;
      }
      continue;
    }

    if (stringSet.has(key) && typeof rawValue === 'string' && rawValue.trim()) {
      const targetKey = canonical as 'scanDate';
      result[targetKey] = rawValue.trim();
      continue;
    }

    if (numericSet.has(key)) {
      const numericValue = toNumber(rawValue);
      if (numericValue !== undefined) {
        (result as Record<string, number>)[key] = numericValue;
      }
    }
  }

  // Keep both aliases populated for backward compatibility.
  if (result.vatMass !== undefined && result.visceralFat === undefined) {
    result.visceralFat = result.vatMass;
  }
  if (result.visceralFat !== undefined && result.vatMass === undefined) {
    result.vatMass = result.visceralFat;
  }

  return result;
}

function parseExtractionResult(content: string): ExtendedBodyComposition | null {
  const jsonPayload = extractJsonObjectFromText(content);
  if (!jsonPayload) return null;

  try {
    const parsed = JSON.parse(jsonPayload) as unknown;
    const sanitized = sanitizeBodyComp(parsed);
    return hasBodyCompValues(sanitized) ? sanitized : null;
  } catch {
    return null;
  }
}

export async function extractBodyCompWithAI(
  text: string
): Promise<ExtendedBodyComposition> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    console.warn('[Vitals.AI] No OpenRouter API key, skipping AI body comp extraction');
    return {};
  }

  const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
    headers: getOpenRouterHeaders(),
  });

  console.log('[Vitals.AI] Extracting body composition with AI...');

  const modelCandidates = getModelCandidates();
  let lastError: unknown;

  for (const modelId of modelCandidates) {
    try {
      const { text: responseText } = await generateText({
        model: openrouter(modelId),
        system: SYSTEM_PROMPT,
        prompt: `Extract all available body composition metrics from this DEXA report.

Return ONLY one valid JSON object (no markdown, no explanation).
Use these exact keys when values are present:
${[...NUMERIC_KEYS, 'sex', ...STRING_KEYS].join(', ')}

DEXA report text:
${text}`,
      });

      const extracted = parseExtractionResult(responseText);
      if (!extracted) {
        console.warn(
          `[Vitals.AI] Body comp extraction parse failed (${modelId}), trying fallback model.`
        );
        continue;
      }

      const fieldCount = Object.keys(extracted).filter(
        (key) => extracted[key as keyof ExtendedBodyComposition] !== undefined
      ).length;
      console.log(
        `[Vitals.AI] AI extracted ${fieldCount} body composition fields (${modelId})`
      );

      if (extracted.bodyFatPercent !== undefined) {
        console.log(`[Vitals.AI] Body Fat: ${extracted.bodyFatPercent}%`);
      }
      if (extracted.leanMass !== undefined) {
        console.log(`[Vitals.AI] Lean Mass: ${extracted.leanMass} lbs`);
      }
      if (extracted.vatMass !== undefined) {
        console.log(`[Vitals.AI] VAT: ${extracted.vatMass} lbs`);
      }

      return extracted;
    } catch (error) {
      lastError = error;
      console.warn(
        `[Vitals.AI] Body comp extraction model failed (${modelId}), trying fallback.`
      );
    }
  }

  if (lastError) {
    console.error('[Vitals.AI] AI body comp extraction error:', lastError);
  } else {
    console.warn('[Vitals.AI] No valid AI body comp response from OpenRouter');
  }

  return {};
}
