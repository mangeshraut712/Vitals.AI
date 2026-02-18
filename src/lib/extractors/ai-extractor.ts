import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { ExtractedBiomarkers, DynamicBiomarker } from './biomarkers';
import { getOpenRouterHeaders } from '@/lib/runtime/deployment';

const DEFAULT_EXTRACTION_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';

const SYSTEM_PROMPT = `You are a lab result extraction assistant. Extract ALL biomarker/test values from lab reports.

IMPORTANT RULES:
- Extract EVERY test result found in the report - do not skip any
- Use the exact numeric value shown (don't convert units)
- Include the unit exactly as shown
- Include reference range if present
- Mark status as 'high' if flagged with H, 'low' if flagged with L, 'normal' otherwise
- For percentage values (like Lymphocytes %), use the percentage line not absolute counts
- Categorize tests when possible (CBC, Metabolic Panel, Lipid Panel, Thyroid, etc.)
- Extract patient age if found

Common test name mappings to be aware of:
- "HS CRP" or "hs-CRP" = C-Reactive Protein
- "HEMOGLOBIN A1c" or "HbA1c" = Hemoglobin A1c
- "WBC" = White Blood Cell Count
- "RBC" = Red Blood Cell Count
- "MCV" = Mean Cell Volume
- "MCH" = Mean Cell Hemoglobin
- "MCHC" = Mean Cell Hemoglobin Concentration
- "RDW" = Red Cell Distribution Width
- "MPV" = Mean Platelet Volume`;

// Comprehensive name mappings for all biomarkers
// Maps lab test names (variations) to our standardized keys
const NAME_TO_KEY: Record<string, string> = {
  // === LIPID PANEL ===
  'total cholesterol': 'totalCholesterol',
  'cholesterol, total': 'totalCholesterol',
  cholesterol: 'totalCholesterol',
  ldl: 'ldl',
  'ldl cholesterol': 'ldl',
  'ldl-cholesterol': 'ldl',
  'ldl-c': 'ldl',
  'ldl chol calc': 'ldl',
  hdl: 'hdl',
  'hdl cholesterol': 'hdl',
  'hdl-c': 'hdl',
  triglycerides: 'triglycerides',
  tg: 'triglycerides',
  'apolipoprotein b': 'apoB',
  apob: 'apoB',
  'apo b': 'apoB',
  'lp(a)': 'lpa',
  'lipoprotein(a)': 'lpa',
  'lipoprotein a': 'lpa',
  vldl: 'vldl',
  'vldl cholesterol': 'vldl',

  // === METABOLIC PANEL ===
  glucose: 'glucose',
  'glucose, fasting': 'glucose',
  'fasting glucose': 'glucose',
  'glucose, serum': 'glucose',
  hba1c: 'hba1c',
  'hemoglobin a1c': 'hba1c',
  'glycohemoglobin': 'hba1c',
  'a1c': 'hba1c',
  insulin: 'fastingInsulin',
  'fasting insulin': 'fastingInsulin',
  'c-peptide': 'cPeptide',
  'c peptide': 'cPeptide',
  fructosamine: 'fructosamine',

  // === LIVER FUNCTION ===
  ast: 'ast',
  'sgot': 'ast',
  'aspartate aminotransferase': 'ast',
  alt: 'alt',
  'sgpt': 'alt',
  'alanine aminotransferase': 'alt',
  ggt: 'ggt',
  'gamma gt': 'ggt',
  'gamma-glutamyl transferase': 'ggt',
  'alkaline phosphatase': 'alkalinePhosphatase',
  alp: 'alkalinePhosphatase',
  'alk phos': 'alkalinePhosphatase',
  bilirubin: 'totalBilirubin',
  'total bilirubin': 'totalBilirubin',
  'bilirubin, total': 'totalBilirubin',
  albumin: 'albumin',
  'total protein': 'totalProtein',
  globulin: 'globulin',

  // === KIDNEY FUNCTION ===
  creatinine: 'creatinine',
  bun: 'bun',
  'blood urea nitrogen': 'bun',
  'urea nitrogen': 'bun',
  egfr: 'egfr',
  'gfr': 'egfr',
  'estimated gfr': 'egfr',
  'cystatin c': 'cystatinC',
  'uric acid': 'uricAcid',

  // === COMPLETE BLOOD COUNT ===
  rbc: 'rbc',
  'red blood cell count': 'rbc',
  'red blood cells': 'rbc',
  wbc: 'wbc',
  'white blood cell count': 'wbc',
  'white blood cells': 'wbc',
  hemoglobin: 'hemoglobin',
  hgb: 'hemoglobin',
  hematocrit: 'hematocrit',
  hct: 'hematocrit',
  mcv: 'mcv',
  'mean cell volume': 'mcv',
  'mean corpuscular volume': 'mcv',
  mch: 'mch',
  'mean cell hemoglobin': 'mch',
  'mean corpuscular hemoglobin': 'mch',
  mchc: 'mchc',
  'mean cell hemoglobin concentration': 'mchc',
  rdw: 'rdw',
  'red cell distribution width': 'rdw',
  platelets: 'platelets',
  'platelet count': 'platelets',
  mpv: 'mpv',
  'mean platelet volume': 'mpv',

  // === WHITE CELL DIFFERENTIAL ===
  neutrophils: 'neutrophils',
  'neutrophil count': 'neutrophils',
  'absolute neutrophils': 'neutrophils',
  anc: 'neutrophils',
  'neutrophils %': 'neutrophilPercent',
  'neutrophil %': 'neutrophilPercent',
  lymphocytes: 'lymphocytePercent',
  'lymphocyte %': 'lymphocytePercent',
  'lymphocytes %': 'lymphocytePercent',
  'absolute lymphocytes': 'lymphocytes',
  alc: 'lymphocytes',
  'lymphocyte count': 'lymphocytes',
  monocytes: 'monocytePercent',
  'monocyte %': 'monocytePercent',
  'monocytes %': 'monocytePercent',
  'absolute monocytes': 'monocytes',
  eosinophils: 'eosinophils',
  'eosinophil count': 'eosinophils',
  basophils: 'basophils',
  'basophil count': 'basophils',

  // === IRON PANEL ===
  ferritin: 'ferritin',
  iron: 'serumIron',
  'serum iron': 'serumIron',
  tibc: 'tibc',
  'total iron binding capacity': 'tibc',
  'iron saturation': 'ironSaturation',
  '% saturation': 'ironSaturation',
  transferrin: 'transferrin',

  // === THYROID PANEL ===
  tsh: 'tsh',
  'thyroid stimulating hormone': 'tsh',
  't4, free': 'freeT4',
  'free t4': 'freeT4',
  ft4: 'freeT4',
  't3, free': 'freeT3',
  'free t3': 'freeT3',
  ft3: 'freeT3',
  'reverse t3': 'reverseT3',
  rt3: 'reverseT3',
  'tpo antibodies': 'tpoAntibodies',
  'thyroid peroxidase ab': 'tpoAntibodies',

  // === INFLAMMATION MARKERS ===
  crp: 'crp',
  'c-reactive protein': 'crp',
  'hs crp': 'crp',
  'hs-crp': 'crp',
  'high sensitivity crp': 'crp',
  esr: 'esr',
  'sed rate': 'esr',
  'erythrocyte sedimentation rate': 'esr',
  homocysteine: 'homocysteine',
  fibrinogen: 'fibrinogen',

  // === VITAMINS ===
  'vitamin d': 'vitaminD',
  'vitamin d, 25-oh': 'vitaminD',
  'vitamin d,25-oh,total,ia': 'vitaminD',
  '25-oh vitamin d': 'vitaminD',
  '25-hydroxyvitamin d': 'vitaminD',
  'vitamin b12': 'vitaminB12',
  b12: 'vitaminB12',
  folate: 'folate',
  'folic acid': 'folate',
  'vitamin b6': 'vitaminB6',

  // === MINERALS ===
  magnesium: 'magnesiumSerum',
  'magnesium, serum': 'magnesiumSerum',
  'magnesium rbc': 'magnesiumRbc',
  zinc: 'zinc',
  selenium: 'selenium',
  copper: 'copper',

  // === ELECTROLYTES ===
  sodium: 'sodium',
  potassium: 'potassium',
  chloride: 'chloride',
  co2: 'co2',
  'carbon dioxide': 'co2',
  bicarbonate: 'co2',
  calcium: 'calcium',

  // === MALE HORMONES ===
  testosterone: 'totalTestosterone',
  'total testosterone': 'totalTestosterone',
  'free testosterone': 'freeTestosterone',
  shbg: 'shbg',
  'sex hormone binding globulin': 'shbg',
  estradiol: 'estradiolMale',
  e2: 'estradiolMale',
  'dhea-s': 'dheas',
  dheas: 'dheas',
  cortisol: 'cortisolAm',
  'cortisol, am': 'cortisolAm',
  'igf-1': 'igf1',
  igf1: 'igf1',
  prolactin: 'prolactin',
  lh: 'lh',
  'luteinizing hormone': 'lh',
  fsh: 'fsh',
  'follicle stimulating hormone': 'fsh',

  // === FEMALE HORMONES ===
  progesterone: 'progesteroneLuteal',
  amh: 'amh',
  'anti-mullerian hormone': 'amh',

  // === CARDIOVASCULAR ===
  'lp-pla2': 'lpPla2',
  mpo: 'mpo',
  myeloperoxidase: 'mpo',
  tmao: 'tmao',
  'nt-probnp': 'ntProBnp',
  bnp: 'ntProBnp',
};

interface AIExtractionResult {
  patientAge?: number;
  biomarkers: DynamicBiomarker[];
}

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

function toDynamicBiomarker(input: unknown): DynamicBiomarker | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const record = input as Record<string, unknown>;
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  const unit = typeof record.unit === 'string' ? record.unit.trim() : '';
  const numericValue =
    typeof record.value === 'number'
      ? record.value
      : typeof record.value === 'string'
        ? Number.parseFloat(record.value)
        : Number.NaN;

  if (!name || !unit || !Number.isFinite(numericValue)) {
    return null;
  }

  const status =
    record.status === 'high' || record.status === 'low' || record.status === 'normal'
      ? record.status
      : undefined;

  return {
    name,
    value: numericValue,
    unit,
    referenceRange:
      typeof record.referenceRange === 'string' && record.referenceRange.trim()
        ? record.referenceRange.trim()
        : undefined,
    status,
    category:
      typeof record.category === 'string' && record.category.trim()
        ? record.category.trim()
        : undefined,
  };
}

function parseAIExtractionResult(content: string): AIExtractionResult | null {
  const jsonPayload = extractJsonObjectFromText(content);
  if (!jsonPayload) return null;

  try {
    const parsed = JSON.parse(jsonPayload) as Record<string, unknown>;
    const rawBiomarkers = Array.isArray(parsed.biomarkers) ? parsed.biomarkers : [];
    const biomarkers = rawBiomarkers
      .map((item) => toDynamicBiomarker(item))
      .filter((item): item is DynamicBiomarker => item !== null);

    if (biomarkers.length === 0) {
      return null;
    }

    const patientAgeRaw =
      typeof parsed.patientAge === 'number'
        ? parsed.patientAge
        : typeof parsed.patientAge === 'string'
          ? Number.parseInt(parsed.patientAge, 10)
          : undefined;
    const patientAge = Number.isFinite(patientAgeRaw) ? patientAgeRaw : undefined;

    return {
      patientAge,
      biomarkers,
    };
  } catch {
    return null;
  }
}

export async function extractBiomarkersWithAI(text: string): Promise<ExtractedBiomarkers> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    console.warn('[Vitals.AI] No OpenRouter API key, skipping AI extraction');
    return {};
  }

  const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
    headers: getOpenRouterHeaders(),
  });

  console.log('[Vitals.AI] Extracting ALL biomarkers with AI...');

  const modelCandidates = getModelCandidates();
  let lastError: unknown;

  for (const modelId of modelCandidates) {
    try {
      const { text: responseText } = await generateText({
        model: openrouter(modelId),
        system: SYSTEM_PROMPT,
        prompt: `Extract ALL biomarkers from this lab report.

Return ONLY a valid JSON object in this shape:
{
  "patientAge": number | null,
  "biomarkers": [
    {
      "name": string,
      "value": number,
      "unit": string,
      "referenceRange": string | null,
      "status": "normal" | "high" | "low",
      "category": string | null
    }
  ]
}

Lab report text:
${text}`,
      });

      const result = parseAIExtractionResult(responseText);
      if (!result) {
        console.warn(`[Vitals.AI] AI extraction parse failed (${modelId}), trying fallback model.`);
        continue;
      }

      const biomarkers = result.biomarkers || [];
      console.log(`[Vitals.AI] AI extracted ${biomarkers.length} biomarkers (${modelId})`);

      const extracted: ExtractedBiomarkers = {
        all: biomarkers,
        patientAge: result.patientAge,
      };

      // Map known biomarkers to specific keys for calculations and display
      for (const marker of biomarkers) {
        const normalizedName = marker.name.toLowerCase().trim();
        const key = NAME_TO_KEY[normalizedName];

        if (!key) {
          continue;
        }

        // Handle percentage vs absolute count disambiguation
        if (key === 'lymphocytePercent' || key === 'neutrophilPercent' || key === 'monocytePercent') {
          if (marker.unit.includes('%')) {
            (extracted as Record<string, unknown>)[key] = marker.value;
          }
        } else if (key === 'lymphocytes' || key === 'neutrophils' || key === 'monocytes') {
          if (!marker.unit.includes('%')) {
            (extracted as Record<string, unknown>)[key] = marker.value;
          }
        } else {
          (extracted as Record<string, unknown>)[key] = marker.value;
        }
      }

      const knownKeys = Object.keys(extracted).filter((k) => k !== 'all' && k !== 'patientAge');
      console.log(`[Vitals.AI] Mapped ${knownKeys.length} to known biomarker keys`);

      return extracted;
    } catch (error) {
      lastError = error;
      console.warn(`[Vitals.AI] AI extraction model failed (${modelId}), trying fallback.`);
    }
  }

  if (lastError) {
    console.error('[Vitals.AI] AI extraction error:', lastError);
  } else {
    console.warn('[Vitals.AI] No valid AI extraction response from OpenRouter');
  }

  return {};
}
