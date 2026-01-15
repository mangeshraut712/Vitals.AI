// Biomarker Cache System
// Persists extracted biomarkers to local JSON file
// Eliminates in-memory singleton issues and makes data persistent

import fs from 'fs';
import path from 'path';
import { BIOMARKER_REFERENCES } from '@/lib/biomarkers/reference';

const DATA_DIR = path.join(process.cwd(), 'data');
const CACHE_DIR = path.join(DATA_DIR, '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'biomarkers.json');

// Normalized biomarker entry (deduplicated)
export interface CachedBiomarker {
  id: string; // Normalized key (e.g., "vitaminD")
  name: string; // Display name (e.g., "Vitamin D (25-OH)")
  value: number;
  unit: string;
  referenceRange?: string;
  labStatus?: 'normal' | 'high' | 'low'; // From lab H/L flag
  category?: string;
  source: 'measured' | 'calculated';
}

export interface BiomarkerCache {
  version: number;
  extractedAt: string;
  sourceFile: string;
  patientAge?: number;
  biomarkers: CachedBiomarker[];
}

// Name normalization map - maps various lab names to our standard IDs
const NAME_TO_ID: Record<string, string> = {
  // Lipids
  'total cholesterol': 'totalCholesterol',
  'cholesterol, total': 'totalCholesterol',
  'cholesterol': 'totalCholesterol',
  'ldl': 'ldl',
  'ldl cholesterol': 'ldl',
  'ldl-cholesterol': 'ldl',
  'ldl-c': 'ldl',
  'ldl chol calc': 'ldl',
  'hdl': 'hdl',
  'hdl cholesterol': 'hdl',
  'hdl-c': 'hdl',
  'triglycerides': 'triglycerides',
  'apolipoprotein b': 'apoB',
  'apob': 'apoB',
  'apo b': 'apoB',
  'lp(a)': 'lpa',
  'lipoprotein(a)': 'lpa',
  'lipoprotein a': 'lpa',
  'vldl': 'vldl',
  'vldl cholesterol': 'vldl',

  // Metabolic
  'glucose': 'glucose',
  'glucose, fasting': 'glucose',
  'fasting glucose': 'glucose',
  'glucose, serum': 'glucose',
  'hba1c': 'hba1c',
  'hemoglobin a1c': 'hba1c',
  'glycohemoglobin': 'hba1c',
  'a1c': 'hba1c',
  'insulin': 'fastingInsulin',
  'fasting insulin': 'fastingInsulin',
  'c-peptide': 'cPeptide',
  'c peptide': 'cPeptide',

  // Liver
  'ast': 'ast',
  'sgot': 'ast',
  'aspartate aminotransferase': 'ast',
  'alt': 'alt',
  'sgpt': 'alt',
  'alanine aminotransferase': 'alt',
  'ggt': 'ggt',
  'gamma gt': 'ggt',
  'gamma-glutamyl transferase': 'ggt',
  'alkaline phosphatase': 'alkalinePhosphatase',
  'alp': 'alkalinePhosphatase',
  'alk phos': 'alkalinePhosphatase',
  'bilirubin': 'totalBilirubin',
  'total bilirubin': 'totalBilirubin',
  'bilirubin, total': 'totalBilirubin',
  'albumin': 'albumin',
  'total protein': 'totalProtein',
  'globulin': 'globulin',

  // Kidney
  'creatinine': 'creatinine',
  'bun': 'bun',
  'blood urea nitrogen': 'bun',
  'urea nitrogen': 'bun',
  'egfr': 'egfr',
  'gfr': 'egfr',
  'estimated gfr': 'egfr',
  'cystatin c': 'cystatinC',
  'uric acid': 'uricAcid',

  // CBC
  'rbc': 'rbc',
  'red blood cell count': 'rbc',
  'red blood cells': 'rbc',
  'wbc': 'wbc',
  'white blood cell count': 'wbc',
  'white blood cells': 'wbc',
  'hemoglobin': 'hemoglobin',
  'hgb': 'hemoglobin',
  'hematocrit': 'hematocrit',
  'hct': 'hematocrit',
  'mcv': 'mcv',
  'mean cell volume': 'mcv',
  'mean corpuscular volume': 'mcv',
  'mch': 'mch',
  'mean cell hemoglobin': 'mch',
  'mean corpuscular hemoglobin': 'mch',
  'mchc': 'mchc',
  'mean cell hemoglobin concentration': 'mchc',
  'rdw': 'rdw',
  'red cell distribution width': 'rdw',
  'platelets': 'platelets',
  'platelet count': 'platelets',
  'mpv': 'mpv',
  'mean platelet volume': 'mpv',

  // Differential
  'neutrophils': 'neutrophils',
  'neutrophil count': 'neutrophils',
  'absolute neutrophils': 'neutrophils',
  'anc': 'neutrophils',
  'neutrophils %': 'neutrophilPercent',
  'neutrophil %': 'neutrophilPercent',
  'lymphocytes': 'lymphocytes',
  'lymphocyte count': 'lymphocytes',
  'absolute lymphocytes': 'lymphocytes',
  'alc': 'lymphocytes',
  'lymphocytes %': 'lymphocytePercent',
  'lymphocyte %': 'lymphocytePercent',
  'monocytes': 'monocytes',
  'monocyte count': 'monocytes',
  'absolute monocytes': 'monocytes',
  'monocytes %': 'monocytePercent',
  'monocyte %': 'monocytePercent',
  'eosinophils': 'eosinophils',
  'eosinophil count': 'eosinophils',
  'basophils': 'basophils',
  'basophil count': 'basophils',

  // Iron
  'ferritin': 'ferritin',
  'iron': 'serumIron',
  'serum iron': 'serumIron',
  'tibc': 'tibc',
  'total iron binding capacity': 'tibc',
  'iron saturation': 'ironSaturation',
  '% saturation': 'ironSaturation',
  'transferrin': 'transferrin',

  // Thyroid
  'tsh': 'tsh',
  'thyroid stimulating hormone': 'tsh',
  't4, free': 'freeT4',
  'free t4': 'freeT4',
  'ft4': 'freeT4',
  't3, free': 'freeT3',
  'free t3': 'freeT3',
  'ft3': 'freeT3',
  'reverse t3': 'reverseT3',
  'rt3': 'reverseT3',
  'tpo antibodies': 'tpoAntibodies',
  'thyroid peroxidase ab': 'tpoAntibodies',

  // Inflammation
  'crp': 'crp',
  'c-reactive protein': 'crp',
  'hs crp': 'crp',
  'hs-crp': 'crp',
  'high sensitivity crp': 'crp',
  'esr': 'esr',
  'sed rate': 'esr',
  'erythrocyte sedimentation rate': 'esr',
  'homocysteine': 'homocysteine',
  'fibrinogen': 'fibrinogen',

  // Vitamins
  'vitamin d': 'vitaminD',
  'vitamin d, 25-oh': 'vitaminD',
  'vitamin d,25-oh,total,ia': 'vitaminD',
  '25-oh vitamin d': 'vitaminD',
  '25-hydroxyvitamin d': 'vitaminD',
  'vitamin b12': 'vitaminB12',
  'b12': 'vitaminB12',
  'folate': 'folate',
  'folic acid': 'folate',
  'vitamin b6': 'vitaminB6',

  // Minerals
  'magnesium': 'magnesiumSerum',
  'magnesium, serum': 'magnesiumSerum',
  'magnesium rbc': 'magnesiumRbc',
  'zinc': 'zinc',
  'selenium': 'selenium',
  'copper': 'copper',

  // Electrolytes
  'sodium': 'sodium',
  'potassium': 'potassium',
  'chloride': 'chloride',
  'co2': 'co2',
  'carbon dioxide': 'co2',
  'bicarbonate': 'co2',
  'calcium': 'calcium',

  // Hormones
  'testosterone': 'totalTestosterone',
  'total testosterone': 'totalTestosterone',
  'free testosterone': 'freeTestosterone',
  'shbg': 'shbg',
  'sex hormone binding globulin': 'shbg',
  'estradiol': 'estradiol',
  'e2': 'estradiol',
  'dhea-s': 'dheas',
  'dheas': 'dheas',
  'cortisol': 'cortisolAm',
  'cortisol, am': 'cortisolAm',
  'igf-1': 'igf1',
  'igf1': 'igf1',
  'prolactin': 'prolactin',
  'lh': 'lh',
  'luteinizing hormone': 'lh',
  'fsh': 'fsh',
  'follicle stimulating hormone': 'fsh',
  'progesterone': 'progesterone',
  'amh': 'amh',
  'anti-mullerian hormone': 'amh',

  // Additional aliases for lab report variations
  // Iron panel
  'iron, total': 'serumIron',
  'iron total': 'serumIron',
  'total iron': 'serumIron',
  'iron binding capacity': 'tibc',
  'iron bind.cap.(tibc)': 'tibc',

  // Thyroid - additional aliases
  't3 uptake': 't3Uptake',
  't4 (thyroxine), total': 'totalT4',
  't4, total': 'totalT4',
  'thyroxine, total': 'totalT4',
  't4 thyroxine total': 'totalT4',
  'free t4 index (t7)': 'freeT4Index',
  'free t4 index': 'freeT4Index',
  't7': 'freeT4Index',

  // Testosterone - additional aliases
  'testosterone, total, ms': 'totalTestosterone',
  'testosterone total ms': 'totalTestosterone',
  'testosterone, free': 'freeTestosterone',
  'testosterone, bioavailable': 'bioavailableTestosterone',
  'bioavailable testosterone': 'bioavailableTestosterone',

  // Lipid ratios from lab
  'chol/hdlc ratio': 'tcHdlRatio',
  'cholesterol/hdl ratio': 'tcHdlRatio',
  'ldl/hdl ratio': 'ldlHdlRatio',
  'non hdl cholesterol': 'nonHdlC',
  'non-hdl cholesterol': 'nonHdlC',
  'non hdl-c': 'nonHdlC',

  // Metabolic - additional aliases
  'urea nitrogen (bun)': 'bun',
  'urea nitrogen': 'bun',
  'protein, total': 'totalProtein',
  'protein total': 'totalProtein',
  'albumin/globulin ratio': 'agRatio',
  'a/g ratio': 'agRatio',
  'ag ratio': 'agRatio',
  'eag (mg/dl)': 'eagMgDl',
  'eag mg/dl': 'eagMgDl',
  'eag (mmol/l)': 'eagMmolL',
  'eag mmol/l': 'eagMmolL',

  // Liver - additional aliases
  'bilirubin, direct': 'directBilirubin',
  'direct bilirubin': 'directBilirubin',
  'bilirubin, indirect': 'indirectBilirubin',
  'indirect bilirubin': 'indirectBilirubin',

  // Hormones - additional aliases
  'dhea sulfate': 'dheas',
  'dhea-sulfate': 'dheas',
  'cortisol, total': 'cortisolAm',
  'cortisol total': 'cortisolAm',

  // WBC Differential - absolute count variations
  'absolute eosinophils': 'eosinophils',
  'eosinophils absolute': 'eosinophils',
  'absolute basophils': 'basophils',
  'basophils absolute': 'basophils',
  'neutrophils (absolute)': 'neutrophils',
  'lymphocytes (absolute)': 'lymphocytes',
  'monocytes (absolute)': 'monocytes',
};

/**
 * Normalize a biomarker name to our standard ID
 */
export function normalizeBiomarkerName(name: string): string {
  const normalized = name.toLowerCase().trim();
  return NAME_TO_ID[normalized] ?? normalized.replace(/[^a-z0-9]/g, '_');
}

/**
 * Get display name for a biomarker ID
 */
export function getDisplayName(id: string, originalName: string): string {
  const ref = BIOMARKER_REFERENCES[id];
  return ref?.name ?? originalName;
}

/**
 * Ensure cache directory exists
 */
function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Read biomarker cache from file
 */
export function readCache(): BiomarkerCache | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      return null;
    }
    const data = fs.readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(data) as BiomarkerCache;
  } catch (error) {
    console.error('[Cache] Error reading cache:', error);
    return null;
  }
}

/**
 * Write biomarker cache to file
 */
export function writeCache(cache: BiomarkerCache): void {
  try {
    ensureCacheDir();
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    console.log(`[Cache] Saved ${cache.biomarkers.length} biomarkers to cache`);
  } catch (error) {
    console.error('[Cache] Error writing cache:', error);
    throw error;
  }
}

/**
 * Clear the cache
 */
export function clearCache(): void {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
      console.log('[Cache] Cache cleared');
    }
  } catch (error) {
    console.error('[Cache] Error clearing cache:', error);
  }
}

/**
 * Check if cache exists and is valid
 */
export function isCacheValid(): boolean {
  const cache = readCache();
  return cache !== null && cache.biomarkers.length > 0;
}
