import Anthropic from '@anthropic-ai/sdk';
import { ExtractedBiomarkers, DynamicBiomarker } from './biomarkers';

const EXTRACTION_TOOL: Anthropic.Tool = {
  name: 'extract_all_biomarkers',
  description: 'Extract ALL biomarker values from a lab report',
  input_schema: {
    type: 'object',
    properties: {
      patientAge: {
        type: 'number',
        description: 'Patient age in years (if found)',
      },
      biomarkers: {
        type: 'array',
        description: 'Array of ALL biomarkers/lab tests found in the report',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Test name exactly as shown (e.g., "ALBUMIN", "WHITE BLOOD CELL COUNT")',
            },
            value: {
              type: 'number',
              description: 'The numeric result value',
            },
            unit: {
              type: 'string',
              description: 'Unit of measurement (e.g., "g/dL", "mg/dL", "%", "K/uL")',
            },
            referenceRange: {
              type: 'string',
              description: 'Reference range as shown (e.g., "3.5-5.0", ">40", "<200")',
            },
            status: {
              type: 'string',
              enum: ['normal', 'high', 'low'],
              description: 'Whether value is flagged as High (H) or Low (L), otherwise normal',
            },
            category: {
              type: 'string',
              description:
                'Category if identifiable (e.g., "Complete Blood Count", "Metabolic Panel", "Lipid Panel", "Thyroid")',
            },
          },
          required: ['name', 'value', 'unit'],
        },
      },
    },
    required: ['biomarkers'],
  },
};

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

// Numeric biomarker keys (excluding 'all' and 'patientAge' for type safety)
type NumericBiomarkerKey = Exclude<keyof ExtractedBiomarkers, 'all' | 'patientAge'>;

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

export async function extractBiomarkersWithAI(text: string): Promise<ExtractedBiomarkers> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('[Vitals.AI] No API key, skipping AI extraction');
    return {};
  }

  try {
    const client = new Anthropic({ apiKey });

    console.log('[Vitals.AI] Extracting ALL biomarkers with AI...');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192, // Increased for large lab reports
      system: SYSTEM_PROMPT,
      tools: [EXTRACTION_TOOL],
      tool_choice: { type: 'tool', name: 'extract_all_biomarkers' },
      messages: [
        {
          role: 'user',
          content: `Extract ALL biomarkers from this lab report. Do not skip any test results:\n\n${text}`,
        },
      ],
    });

    // Get tool use result
    const toolUse = response.content.find((block) => block.type === 'tool_use');
    if (toolUse && toolUse.type === 'tool_use') {
      const result = toolUse.input as AIExtractionResult;
      const biomarkers = result.biomarkers || [];

      console.log(`[Vitals.AI] AI extracted ${biomarkers.length} biomarkers`);

      // Build the ExtractedBiomarkers object
      const extracted: ExtractedBiomarkers = {
        all: biomarkers,
        patientAge: result.patientAge,
      };

      // Map known biomarkers to specific keys for calculations and display
      for (const marker of biomarkers) {
        const normalizedName = marker.name.toLowerCase().trim();
        const key = NAME_TO_KEY[normalizedName];

        if (key) {
          // Handle percentage vs absolute count disambiguation
          if (key === 'lymphocytePercent' || key === 'neutrophilPercent' || key === 'monocytePercent') {
            // Only use if unit contains %
            if (marker.unit.includes('%')) {
              (extracted as Record<string, unknown>)[key] = marker.value;
            }
          } else if (key === 'lymphocytes' || key === 'neutrophils' || key === 'monocytes') {
            // Absolute counts - check unit doesn't contain %
            if (!marker.unit.includes('%')) {
              (extracted as Record<string, unknown>)[key] = marker.value;
            }
          } else {
            // All other biomarkers
            (extracted as Record<string, unknown>)[key] = marker.value;
          }
        }
      }

      const knownKeys = Object.keys(extracted).filter((k) => k !== 'all' && k !== 'patientAge');
      console.log(`[Vitals.AI] Mapped ${knownKeys.length} to known biomarker keys`);

      return extracted;
    }

    console.warn('[Vitals.AI] No tool use in response');
    return {};
  } catch (error) {
    console.error('[Vitals.AI] AI extraction error:', error);
    return {};
  }
}
