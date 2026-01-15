// Comprehensive Biomarker Reference Table
// Source: rules/biomarker-reference-table.md
// Total: 132 biomarkers including calculated ratios and indices

export type BiomarkerDirection = 'lower' | 'higher' | 'mid-range' | 'context';

export interface BiomarkerRange {
  min?: number;
  max?: number;
}

export interface BiomarkerReference {
  id: string;
  name: string;
  category: string;
  unit: string;
  standardRange?: BiomarkerRange;
  optimalRange?: BiomarkerRange;
  direction: BiomarkerDirection;
  isCalculated?: boolean;
  formula?: string;
  // For gender-specific ranges
  maleOptimal?: BiomarkerRange;
  femaleOptimal?: BiomarkerRange;
}

export type BiomarkerCategory =
  | 'lipids'
  | 'lipid-ratios'
  | 'metabolic'
  | 'insulin-calcs'
  | 'liver'
  | 'kidney'
  | 'cbc'
  | 'iron'
  | 'cbc-ratios'
  | 'thyroid'
  | 'inflammation'
  | 'vitamins'
  | 'minerals'
  | 'male-hormones'
  | 'female-hormones'
  | 'cardiovascular'
  | 'oxidative-stress'
  | 'gut-health'
  | 'heavy-metals'
  | 'autoimmune'
  | 'cancer-screening';

export const BIOMARKER_CATEGORIES: Record<BiomarkerCategory, string> = {
  'lipids': 'Lipid Panel',
  'lipid-ratios': 'Lipid Ratios',
  'metabolic': 'Metabolic Panel',
  'insulin-calcs': 'Insulin Calculations',
  'liver': 'Liver Function',
  'kidney': 'Kidney Function',
  'cbc': 'Complete Blood Count',
  'iron': 'Iron Panel',
  'cbc-ratios': 'CBC Inflammation Ratios',
  'thyroid': 'Thyroid Panel',
  'inflammation': 'Inflammation Markers',
  'vitamins': 'Vitamins',
  'minerals': 'Minerals & Fatty Acids',
  'male-hormones': 'Male Hormones',
  'female-hormones': 'Female Hormones',
  'cardiovascular': 'Advanced Cardiovascular',
  'oxidative-stress': 'Oxidative Stress',
  'gut-health': 'Gut Health',
  'heavy-metals': 'Heavy Metals',
  'autoimmune': 'Autoimmune Markers',
  'cancer-screening': 'Cancer Screening',
};

// All 132 biomarkers with their reference ranges
export const BIOMARKER_REFERENCES: Record<string, BiomarkerReference> = {
  // ============================================
  // 1. LIPID PANEL (11 markers)
  // ============================================
  totalCholesterol: {
    id: 'totalCholesterol',
    name: 'Total Cholesterol',
    category: 'lipids',
    unit: 'mg/dL',
    standardRange: { max: 200 },
    optimalRange: { max: 180 },
    direction: 'lower',
  },
  ldl: {
    id: 'ldl',
    name: 'LDL-C',
    category: 'lipids',
    unit: 'mg/dL',
    standardRange: { max: 100 },
    optimalRange: { max: 70 }, // Attia recommends <30
    direction: 'lower',
  },
  hdl: {
    id: 'hdl',
    name: 'HDL-C',
    category: 'lipids',
    unit: 'mg/dL',
    standardRange: { min: 40 }, // M: >40, F: >50
    optimalRange: { min: 60, max: 100 },
    direction: 'higher',
    maleOptimal: { min: 60, max: 100 },
    femaleOptimal: { min: 60, max: 100 },
  },
  triglycerides: {
    id: 'triglycerides',
    name: 'Triglycerides',
    category: 'lipids',
    unit: 'mg/dL',
    standardRange: { max: 150 },
    optimalRange: { max: 70 }, // <100 acceptable
    direction: 'lower',
  },
  apoB: {
    id: 'apoB',
    name: 'ApoB',
    category: 'lipids',
    unit: 'mg/dL',
    standardRange: { max: 90 },
    optimalRange: { min: 40, max: 70 }, // Attia: <60
    direction: 'lower',
  },
  lpa: {
    id: 'lpa',
    name: 'Lp(a)',
    category: 'lipids',
    unit: 'nmol/L',
    standardRange: { max: 75 },
    optimalRange: { max: 50 }, // Genetically fixed
    direction: 'lower',
  },
  ldlP: {
    id: 'ldlP',
    name: 'LDL-P',
    category: 'lipids',
    unit: 'nmol/L',
    standardRange: { max: 1300 },
    optimalRange: { max: 1000 },
    direction: 'lower',
  },
  sdLDL: {
    id: 'sdLDL',
    name: 'Small Dense LDL',
    category: 'lipids',
    unit: 'nmol/L',
    standardRange: { max: 527 },
    optimalRange: { max: 142 },
    direction: 'lower',
  },
  vldl: {
    id: 'vldl',
    name: 'VLDL',
    category: 'lipids',
    unit: 'mg/dL',
    standardRange: { max: 30 },
    optimalRange: { max: 30 },
    direction: 'lower',
  },
  nonHdlC: {
    id: 'nonHdlC',
    name: 'Non-HDL-C',
    category: 'lipids',
    unit: 'mg/dL',
    standardRange: { max: 130 },
    optimalRange: { max: 100 },
    direction: 'lower',
    isCalculated: true,
    formula: 'totalCholesterol - hdl',
  },
  oxidizedLDL: {
    id: 'oxidizedLDL',
    name: 'Oxidized LDL',
    category: 'lipids',
    unit: 'U/L',
    standardRange: { max: 70 },
    optimalRange: { max: 60 },
    direction: 'lower',
  },

  // ============================================
  // 2. LIPID RATIOS - Calculated (6 markers)
  // ============================================
  tcHdlRatio: {
    id: 'tcHdlRatio',
    name: 'TC/HDL Ratio (Castelli Index)',
    category: 'lipid-ratios',
    unit: 'ratio',
    optimalRange: { max: 3.5 },
    direction: 'lower',
    isCalculated: true,
    formula: 'totalCholesterol / hdl',
  },
  ldlHdlRatio: {
    id: 'ldlHdlRatio',
    name: 'LDL/HDL Ratio',
    category: 'lipid-ratios',
    unit: 'ratio',
    optimalRange: { max: 2.0 },
    direction: 'lower',
    isCalculated: true,
    formula: 'ldl / hdl',
  },
  tgHdlRatio: {
    id: 'tgHdlRatio',
    name: 'TG/HDL Ratio',
    category: 'lipid-ratios',
    unit: 'ratio',
    optimalRange: { max: 1.0 },
    direction: 'lower',
    isCalculated: true,
    formula: 'triglycerides / hdl',
  },
  atherogenicIndex: {
    id: 'atherogenicIndex',
    name: 'Atherogenic Index of Plasma',
    category: 'lipid-ratios',
    unit: 'index',
    optimalRange: { max: 0.11 },
    direction: 'lower',
    isCalculated: true,
    formula: 'log10(triglycerides / hdl) [mmol/L]',
  },
  remnantCholesterol: {
    id: 'remnantCholesterol',
    name: 'Remnant Cholesterol',
    category: 'lipid-ratios',
    unit: 'mg/dL',
    optimalRange: { max: 30 },
    direction: 'lower',
    isCalculated: true,
    formula: 'totalCholesterol - hdl - ldl',
  },

  // ============================================
  // 3. METABOLIC PANEL (5 markers)
  // ============================================
  glucose: {
    id: 'glucose',
    name: 'Fasting Glucose',
    category: 'metabolic',
    unit: 'mg/dL',
    standardRange: { min: 65, max: 99 },
    optimalRange: { min: 80, max: 90 },
    direction: 'lower',
  },
  hba1c: {
    id: 'hba1c',
    name: 'HbA1c',
    category: 'metabolic',
    unit: '%',
    standardRange: { max: 5.7 },
    optimalRange: { min: 4.5, max: 5.25 },
    direction: 'lower',
  },
  fastingInsulin: {
    id: 'fastingInsulin',
    name: 'Fasting Insulin',
    category: 'metabolic',
    unit: 'μU/mL',
    standardRange: { min: 2, max: 25 },
    optimalRange: { min: 2, max: 5 },
    direction: 'lower',
  },
  cPeptide: {
    id: 'cPeptide',
    name: 'C-peptide',
    category: 'metabolic',
    unit: 'ng/mL',
    standardRange: { min: 0.8, max: 3.85 },
    optimalRange: { min: 1.0, max: 2.5 },
    direction: 'mid-range',
  },
  fructosamine: {
    id: 'fructosamine',
    name: 'Fructosamine',
    category: 'metabolic',
    unit: 'μmol/L',
    standardRange: { min: 190, max: 285 },
    optimalRange: { min: 190, max: 250 },
    direction: 'lower',
  },

  // ============================================
  // 4. INSULIN SENSITIVITY - Calculated (3 markers)
  // ============================================
  homaIr: {
    id: 'homaIr',
    name: 'HOMA-IR',
    category: 'insulin-calcs',
    unit: 'index',
    optimalRange: { max: 1.0 },
    direction: 'lower',
    isCalculated: true,
    formula: '(fastingInsulin * glucose) / 405',
  },
  quicki: {
    id: 'quicki',
    name: 'QUICKI',
    category: 'insulin-calcs',
    unit: 'index',
    optimalRange: { min: 0.35 },
    direction: 'higher',
    isCalculated: true,
    formula: '1 / (log10(fastingInsulin) + log10(glucose))',
  },
  tygIndex: {
    id: 'tygIndex',
    name: 'TyG Index',
    category: 'insulin-calcs',
    unit: 'index',
    optimalRange: { max: 8.5 },
    direction: 'lower',
    isCalculated: true,
    formula: 'ln((triglycerides * glucose) / 2)',
  },

  // ============================================
  // 5. LIVER FUNCTION (8 markers)
  // ============================================
  ast: {
    id: 'ast',
    name: 'AST',
    category: 'liver',
    unit: 'U/L',
    standardRange: { min: 10, max: 40 },
    optimalRange: { max: 20 },
    direction: 'lower',
  },
  alt: {
    id: 'alt',
    name: 'ALT',
    category: 'liver',
    unit: 'U/L',
    standardRange: { max: 45 }, // M: <45, F: <40
    optimalRange: { max: 20 },
    direction: 'lower',
  },
  ggt: {
    id: 'ggt',
    name: 'GGT',
    category: 'liver',
    unit: 'U/L',
    standardRange: { max: 50 }, // M: <50, F: <35
    optimalRange: { max: 25 },
    direction: 'lower',
  },
  alkalinePhosphatase: {
    id: 'alkalinePhosphatase',
    name: 'Alkaline Phosphatase',
    category: 'liver',
    unit: 'U/L',
    standardRange: { min: 45, max: 115 },
    optimalRange: { min: 44, max: 100 },
    direction: 'mid-range',
  },
  totalBilirubin: {
    id: 'totalBilirubin',
    name: 'Total Bilirubin',
    category: 'liver',
    unit: 'mg/dL',
    standardRange: { min: 0.1, max: 1.2 },
    optimalRange: { min: 0.1, max: 1.0 },
    direction: 'lower',
  },
  albumin: {
    id: 'albumin',
    name: 'Albumin',
    category: 'liver',
    unit: 'g/dL',
    standardRange: { min: 3.5, max: 5.0 },
    optimalRange: { min: 4.0, max: 5.0 },
    direction: 'higher',
  },
  agRatio: {
    id: 'agRatio',
    name: 'A/G Ratio',
    category: 'liver',
    unit: 'ratio',
    standardRange: { min: 1.0, max: 2.0 },
    optimalRange: { min: 1.2, max: 2.0 },
    direction: 'higher',
  },
  deRitisRatio: {
    id: 'deRitisRatio',
    name: 'AST:ALT (De Ritis Ratio)',
    category: 'liver',
    unit: 'ratio',
    optimalRange: { min: 0.8, max: 1.2 },
    direction: 'mid-range',
    isCalculated: true,
    formula: 'ast / alt',
  },

  // ============================================
  // 6. KIDNEY FUNCTION (6 markers)
  // ============================================
  creatinine: {
    id: 'creatinine',
    name: 'Creatinine',
    category: 'kidney',
    unit: 'mg/dL',
    standardRange: { min: 0.7, max: 1.3 },
    optimalRange: { min: 0.8, max: 1.2 },
    direction: 'context',
    maleOptimal: { min: 0.8, max: 1.2 },
    femaleOptimal: { min: 0.6, max: 1.0 },
  },
  bun: {
    id: 'bun',
    name: 'BUN',
    category: 'kidney',
    unit: 'mg/dL',
    standardRange: { min: 6, max: 24 },
    optimalRange: { min: 10, max: 16 },
    direction: 'mid-range',
  },
  egfr: {
    id: 'egfr',
    name: 'eGFR',
    category: 'kidney',
    unit: 'mL/min/1.73m²',
    standardRange: { min: 60 },
    optimalRange: { min: 90 },
    direction: 'higher',
  },
  cystatinC: {
    id: 'cystatinC',
    name: 'Cystatin C',
    category: 'kidney',
    unit: 'mg/L',
    standardRange: { min: 0.5, max: 1.0 },
    optimalRange: { min: 0.6, max: 0.9 },
    direction: 'lower',
  },
  bunCreatinineRatio: {
    id: 'bunCreatinineRatio',
    name: 'BUN/Creatinine Ratio',
    category: 'kidney',
    unit: 'ratio',
    standardRange: { min: 10, max: 20 },
    optimalRange: { min: 12, max: 16 },
    direction: 'mid-range',
    isCalculated: true,
    formula: 'bun / creatinine',
  },
  uricAcid: {
    id: 'uricAcid',
    name: 'Uric Acid',
    category: 'kidney',
    unit: 'mg/dL',
    standardRange: { min: 3.4, max: 7.0 },
    optimalRange: { max: 5.0 },
    direction: 'lower',
    maleOptimal: { max: 5.0 },
    femaleOptimal: { max: 4.0 },
  },

  // ============================================
  // 7. COMPLETE BLOOD COUNT (8 markers)
  // ============================================
  rbc: {
    id: 'rbc',
    name: 'RBC',
    category: 'cbc',
    unit: 'million/µL',
    standardRange: { min: 4.6, max: 6.2 },
    optimalRange: { min: 4.4, max: 4.9 },
    direction: 'mid-range',
    maleOptimal: { min: 4.4, max: 4.9 },
    femaleOptimal: { min: 4.0, max: 4.5 },
  },
  wbc: {
    id: 'wbc',
    name: 'WBC',
    category: 'cbc',
    unit: '×10⁹/L',
    standardRange: { min: 4.5, max: 11.0 },
    optimalRange: { min: 5.0, max: 8.0 },
    direction: 'mid-range',
  },
  hemoglobin: {
    id: 'hemoglobin',
    name: 'Hemoglobin',
    category: 'cbc',
    unit: 'g/dL',
    standardRange: { min: 13.8, max: 17.2 },
    optimalRange: { min: 14.0, max: 15.0 },
    direction: 'mid-range',
    maleOptimal: { min: 14.0, max: 15.0 },
    femaleOptimal: { min: 13.5, max: 14.5 },
  },
  hematocrit: {
    id: 'hematocrit',
    name: 'Hematocrit',
    category: 'cbc',
    unit: '%',
    standardRange: { min: 40, max: 54 },
    optimalRange: { min: 39, max: 45 },
    direction: 'mid-range',
    maleOptimal: { min: 39, max: 45 },
    femaleOptimal: { min: 37, max: 44 },
  },
  mcv: {
    id: 'mcv',
    name: 'MCV',
    category: 'cbc',
    unit: 'fL',
    standardRange: { min: 80, max: 100 },
    optimalRange: { min: 85, max: 92 },
    direction: 'mid-range',
  },
  rdw: {
    id: 'rdw',
    name: 'RDW',
    category: 'cbc',
    unit: '%',
    standardRange: { min: 11.5, max: 15.4 },
    optimalRange: { min: 11.5, max: 13.0 },
    direction: 'lower',
  },
  platelets: {
    id: 'platelets',
    name: 'Platelets',
    category: 'cbc',
    unit: '×10⁹/L',
    standardRange: { min: 150, max: 400 },
    optimalRange: { min: 175, max: 250 },
    direction: 'mid-range',
  },
  mpv: {
    id: 'mpv',
    name: 'MPV',
    category: 'cbc',
    unit: 'fL',
    standardRange: { min: 7.5, max: 11.5 },
    optimalRange: { min: 7.5, max: 10.5 },
    direction: 'mid-range',
  },

  // ============================================
  // 8. IRON PANEL (5 markers)
  // ============================================
  ferritin: {
    id: 'ferritin',
    name: 'Ferritin',
    category: 'iron',
    unit: 'ng/mL',
    standardRange: { min: 12, max: 300 },
    optimalRange: { min: 50, max: 150 },
    direction: 'mid-range',
    maleOptimal: { min: 50, max: 150 },
    femaleOptimal: { min: 40, max: 70 },
  },
  serumIron: {
    id: 'serumIron',
    name: 'Serum Iron',
    category: 'iron',
    unit: 'µg/dL',
    standardRange: { min: 59, max: 158 },
    optimalRange: { min: 85, max: 130 },
    direction: 'mid-range',
  },
  tibc: {
    id: 'tibc',
    name: 'TIBC',
    category: 'iron',
    unit: 'µg/dL',
    standardRange: { min: 250, max: 450 },
    optimalRange: { min: 250, max: 350 },
    direction: 'mid-range',
  },
  ironSaturation: {
    id: 'ironSaturation',
    name: 'Iron Saturation',
    category: 'iron',
    unit: '%',
    standardRange: { min: 20, max: 50 },
    optimalRange: { min: 20, max: 35 },
    direction: 'mid-range',
  },
  transferrin: {
    id: 'transferrin',
    name: 'Transferrin',
    category: 'iron',
    unit: 'mg/dL',
    standardRange: { min: 200, max: 360 },
    optimalRange: { min: 200, max: 300 },
    direction: 'mid-range',
  },

  // ============================================
  // 9. CBC INFLAMMATION RATIOS - Calculated (5 markers)
  // ============================================
  nlr: {
    id: 'nlr',
    name: 'NLR (Neutrophil-to-Lymphocyte)',
    category: 'cbc-ratios',
    unit: 'ratio',
    optimalRange: { min: 1.2, max: 2.0 },
    direction: 'lower',
    isCalculated: true,
    formula: 'neutrophils / lymphocytes (absolute)',
  },
  plr: {
    id: 'plr',
    name: 'PLR (Platelet-to-Lymphocyte)',
    category: 'cbc-ratios',
    unit: 'ratio',
    optimalRange: { max: 135 },
    direction: 'lower',
    isCalculated: true,
    formula: 'platelets / lymphocytes (absolute)',
  },
  mlr: {
    id: 'mlr',
    name: 'MLR (Monocyte-to-Lymphocyte)',
    category: 'cbc-ratios',
    unit: 'ratio',
    optimalRange: { max: 0.29 },
    direction: 'lower',
    isCalculated: true,
    formula: 'monocytes / lymphocytes (absolute)',
  },
  sii: {
    id: 'sii',
    name: 'SII (Systemic Immune-Inflammation Index)',
    category: 'cbc-ratios',
    unit: 'index',
    optimalRange: { min: 200, max: 500 },
    direction: 'mid-range',
    isCalculated: true,
    formula: '(platelets * neutrophils) / lymphocytes',
  },
  siri: {
    id: 'siri',
    name: 'SIRI (Systemic Inflammation Response Index)',
    category: 'cbc-ratios',
    unit: 'index',
    optimalRange: { max: 1.0 },
    direction: 'lower',
    isCalculated: true,
    formula: '(monocytes * neutrophils) / lymphocytes',
  },

  // ============================================
  // 10. THYROID PANEL (7 markers)
  // ============================================
  tsh: {
    id: 'tsh',
    name: 'TSH',
    category: 'thyroid',
    unit: 'mIU/L',
    standardRange: { min: 0.45, max: 4.5 },
    optimalRange: { min: 1.0, max: 2.5 },
    direction: 'lower',
  },
  freeT4: {
    id: 'freeT4',
    name: 'Free T4',
    category: 'thyroid',
    unit: 'ng/dL',
    standardRange: { min: 0.82, max: 1.76 },
    optimalRange: { min: 1.1, max: 1.6 },
    direction: 'higher',
  },
  freeT3: {
    id: 'freeT3',
    name: 'Free T3',
    category: 'thyroid',
    unit: 'pg/mL',
    standardRange: { min: 2.0, max: 4.4 },
    optimalRange: { min: 3.2, max: 4.2 },
    direction: 'higher',
  },
  reverseT3: {
    id: 'reverseT3',
    name: 'Reverse T3',
    category: 'thyroid',
    unit: 'ng/dL',
    standardRange: { min: 9, max: 27 },
    optimalRange: { min: 10, max: 20 },
    direction: 'lower',
  },
  tpoAntibodies: {
    id: 'tpoAntibodies',
    name: 'TPO Antibodies',
    category: 'thyroid',
    unit: 'IU/mL',
    standardRange: { max: 34 },
    optimalRange: { max: 9 },
    direction: 'lower',
  },
  tgAb: {
    id: 'tgAb',
    name: 'Thyroglobulin Antibodies',
    category: 'thyroid',
    unit: 'IU/mL',
    standardRange: { max: 40 },
    optimalRange: { max: 1 },
    direction: 'lower',
  },
  ft3Rt3Ratio: {
    id: 'ft3Rt3Ratio',
    name: 'FT3/rT3 Ratio',
    category: 'thyroid',
    unit: 'ratio',
    optimalRange: { min: 0.20 },
    direction: 'higher',
    isCalculated: true,
    formula: 'freeT3 / reverseT3',
  },
  // Additional thyroid markers from lab reports
  t3Uptake: {
    id: 't3Uptake',
    name: 'T3 Uptake',
    category: 'thyroid',
    unit: '%',
    standardRange: { min: 22, max: 35 },
    optimalRange: { min: 24, max: 32 },
    direction: 'mid-range',
  },
  totalT4: {
    id: 'totalT4',
    name: 'Total T4',
    category: 'thyroid',
    unit: 'mcg/dL',
    standardRange: { min: 4.5, max: 12.5 },
    optimalRange: { min: 6, max: 10 },
    direction: 'mid-range',
  },
  freeT4Index: {
    id: 'freeT4Index',
    name: 'Free T4 Index',
    category: 'thyroid',
    unit: 'index',
    standardRange: { min: 1.4, max: 3.8 },
    optimalRange: { min: 1.5, max: 4.5 },
    direction: 'mid-range',
  },

  // ============================================
  // ADDITIONAL BIOMARKERS FROM LAB REPORTS
  // ============================================
  bioavailableTestosterone: {
    id: 'bioavailableTestosterone',
    name: 'Bioavailable Testosterone',
    category: 'male-hormones',
    unit: 'ng/dL',
    standardRange: { min: 130, max: 680 },
    optimalRange: { min: 250, max: 500 },
    direction: 'higher',
  },
  eagMgDl: {
    id: 'eagMgDl',
    name: 'eAG (Estimated Average Glucose)',
    category: 'metabolic',
    unit: 'mg/dL',
    standardRange: { max: 117 },
    optimalRange: { max: 100 },
    direction: 'lower',
  },
  eagMmolL: {
    id: 'eagMmolL',
    name: 'eAG (mmol/L)',
    category: 'metabolic',
    unit: 'mmol/L',
    standardRange: { max: 6.5 },
    optimalRange: { max: 5.6 },
    direction: 'lower',
  },
  directBilirubin: {
    id: 'directBilirubin',
    name: 'Direct Bilirubin',
    category: 'liver',
    unit: 'mg/dL',
    standardRange: { max: 0.3 },
    optimalRange: { max: 0.2 },
    direction: 'lower',
  },
  indirectBilirubin: {
    id: 'indirectBilirubin',
    name: 'Indirect Bilirubin',
    category: 'liver',
    unit: 'mg/dL',
    standardRange: { min: 0.1, max: 0.9 },
    optimalRange: { min: 0.1, max: 0.8 },
    direction: 'lower',
  },

  // ============================================
  // 11. INFLAMMATION MARKERS (6 markers)
  // ============================================
  crp: {
    id: 'crp',
    name: 'hs-CRP',
    category: 'inflammation',
    unit: 'mg/L',
    standardRange: { max: 3.0 },
    optimalRange: { max: 0.5 }, // Functional: <0.5, AHA: <1.0
    direction: 'lower',
  },
  esr: {
    id: 'esr',
    name: 'ESR',
    category: 'inflammation',
    unit: 'mm/hr',
    standardRange: { max: 20 },
    optimalRange: { max: 10 },
    direction: 'lower',
    maleOptimal: { max: 10 },
    femaleOptimal: { max: 15 },
  },
  homocysteine: {
    id: 'homocysteine',
    name: 'Homocysteine',
    category: 'inflammation',
    unit: 'µmol/L',
    standardRange: { min: 5, max: 15 },
    optimalRange: { max: 7 }, // Function: <7, Attia: 6-8
    direction: 'lower',
  },
  fibrinogen: {
    id: 'fibrinogen',
    name: 'Fibrinogen',
    category: 'inflammation',
    unit: 'mg/dL',
    standardRange: { min: 200, max: 400 },
    optimalRange: { min: 200, max: 300 },
    direction: 'lower',
  },
  il6: {
    id: 'il6',
    name: 'IL-6',
    category: 'inflammation',
    unit: 'pg/mL',
    standardRange: { max: 5 },
    optimalRange: { max: 2 },
    direction: 'lower',
  },
  tnfAlpha: {
    id: 'tnfAlpha',
    name: 'TNF-alpha',
    category: 'inflammation',
    unit: 'pg/mL',
    standardRange: { max: 8.1 },
    optimalRange: { max: 2 },
    direction: 'lower',
  },

  // ============================================
  // 12. VITAMINS (5 markers)
  // ============================================
  vitaminD: {
    id: 'vitaminD',
    name: 'Vitamin D (25-OH)',
    category: 'vitamins',
    unit: 'ng/mL',
    standardRange: { min: 30, max: 100 },
    optimalRange: { min: 40, max: 60 }, // Functional: 60-80
    direction: 'higher',
  },
  vitaminB12: {
    id: 'vitaminB12',
    name: 'Vitamin B12',
    category: 'vitamins',
    unit: 'pg/mL',
    standardRange: { min: 200, max: 900 },
    optimalRange: { min: 450, max: 2000 },
    direction: 'higher',
  },
  folate: {
    id: 'folate',
    name: 'Folate',
    category: 'vitamins',
    unit: 'ng/mL',
    standardRange: { min: 3, max: 20 },
    optimalRange: { min: 8 },
    direction: 'higher',
  },
  mma: {
    id: 'mma',
    name: 'MMA (B12 Functional)',
    category: 'vitamins',
    unit: 'nmol/L',
    standardRange: { min: 70, max: 378 },
    optimalRange: { max: 260 },
    direction: 'lower',
  },
  vitaminB6: {
    id: 'vitaminB6',
    name: 'Vitamin B6',
    category: 'vitamins',
    unit: 'ng/mL',
    standardRange: { min: 5, max: 50 },
    optimalRange: { min: 20, max: 50 },
    direction: 'higher',
  },

  // ============================================
  // 13. MINERALS & FATTY ACIDS (8 markers)
  // ============================================
  magnesiumRbc: {
    id: 'magnesiumRbc',
    name: 'Magnesium RBC',
    category: 'minerals',
    unit: 'mg/dL',
    standardRange: { min: 4.2, max: 6.8 },
    optimalRange: { min: 5.5, max: 6.5 },
    direction: 'higher',
  },
  magnesiumSerum: {
    id: 'magnesiumSerum',
    name: 'Serum Magnesium',
    category: 'minerals',
    unit: 'mg/dL',
    standardRange: { min: 1.7, max: 2.4 },
    optimalRange: { min: 2.0 },
    direction: 'higher',
  },
  zinc: {
    id: 'zinc',
    name: 'Zinc',
    category: 'minerals',
    unit: 'µg/dL',
    standardRange: { min: 60, max: 130 },
    optimalRange: { min: 80, max: 120 },
    direction: 'mid-range',
  },
  selenium: {
    id: 'selenium',
    name: 'Selenium',
    category: 'minerals',
    unit: 'µg/L',
    standardRange: { min: 70, max: 150 },
    optimalRange: { min: 110, max: 150 },
    direction: 'higher',
  },
  copper: {
    id: 'copper',
    name: 'Copper',
    category: 'minerals',
    unit: 'µg/dL',
    standardRange: { min: 70, max: 140 },
    optimalRange: { min: 80, max: 120 },
    direction: 'mid-range',
  },
  copperZincRatio: {
    id: 'copperZincRatio',
    name: 'Copper/Zinc Ratio',
    category: 'minerals',
    unit: 'ratio',
    optimalRange: { min: 0.7, max: 1.0 },
    direction: 'mid-range',
    isCalculated: true,
    formula: 'copper / zinc',
  },
  omega3Index: {
    id: 'omega3Index',
    name: 'Omega-3 Index',
    category: 'minerals',
    unit: '%',
    standardRange: { min: 4, max: 5 },
    optimalRange: { min: 8, max: 12 },
    direction: 'higher',
  },
  omega6Omega3Ratio: {
    id: 'omega6Omega3Ratio',
    name: 'Omega-6/Omega-3 Ratio',
    category: 'minerals',
    unit: 'ratio',
    standardRange: { min: 15, max: 20 },
    optimalRange: { min: 2, max: 4 },
    direction: 'lower',
  },

  // ============================================
  // 14. MALE HORMONES (11 markers)
  // ============================================
  totalTestosterone: {
    id: 'totalTestosterone',
    name: 'Total Testosterone',
    category: 'male-hormones',
    unit: 'ng/dL',
    standardRange: { min: 250, max: 1100 },
    optimalRange: { min: 400, max: 700 },
    direction: 'higher',
  },
  freeTestosterone: {
    id: 'freeTestosterone',
    name: 'Free Testosterone',
    category: 'male-hormones',
    unit: 'pg/mL',
    standardRange: { min: 35, max: 155 },
    optimalRange: { min: 100, max: 155 },
    direction: 'higher',
  },
  shbg: {
    id: 'shbg',
    name: 'SHBG',
    category: 'male-hormones',
    unit: 'nmol/L',
    standardRange: { min: 10, max: 57 },
    optimalRange: { min: 20, max: 40 },
    direction: 'mid-range',
  },
  estradiolMale: {
    id: 'estradiolMale',
    name: 'Estradiol (Male)',
    category: 'male-hormones',
    unit: 'pg/mL',
    standardRange: { min: 10, max: 40 },
    optimalRange: { min: 20, max: 30 },
    direction: 'mid-range',
  },
  dheas: {
    id: 'dheas',
    name: 'DHEA-S',
    category: 'male-hormones',
    unit: 'µg/dL',
    direction: 'higher',
  },
  cortisolAm: {
    id: 'cortisolAm',
    name: 'Cortisol (AM)',
    category: 'male-hormones',
    unit: 'µg/dL',
    standardRange: { min: 6, max: 23 },
    optimalRange: { min: 10, max: 18 },
    direction: 'mid-range',
  },
  igf1: {
    id: 'igf1',
    name: 'IGF-1',
    category: 'male-hormones',
    unit: 'ng/mL',
    standardRange: { min: 101, max: 267 },
    optimalRange: { max: 175 }, // For longevity
    direction: 'context',
  },
  prolactin: {
    id: 'prolactin',
    name: 'Prolactin',
    category: 'male-hormones',
    unit: 'ng/mL',
    standardRange: { min: 2, max: 18 },
    optimalRange: { max: 10 },
    direction: 'lower',
  },
  lh: {
    id: 'lh',
    name: 'LH',
    category: 'male-hormones',
    unit: 'mIU/mL',
    standardRange: { min: 1.5, max: 9.3 },
    optimalRange: { min: 2, max: 8 },
    direction: 'mid-range',
  },
  fsh: {
    id: 'fsh',
    name: 'FSH',
    category: 'male-hormones',
    unit: 'mIU/mL',
    standardRange: { min: 1.5, max: 12.4 },
    optimalRange: { min: 1, max: 8 },
    direction: 'mid-range',
  },
  freeAndrogenIndex: {
    id: 'freeAndrogenIndex',
    name: 'Free Androgen Index',
    category: 'male-hormones',
    unit: 'index',
    direction: 'context',
    isCalculated: true,
    formula: '(totalTestosterone [nmol/L] * 100) / shbg',
  },

  // ============================================
  // 15. FEMALE HORMONES (9 markers) - simplified
  // ============================================
  estradiolFollicular: {
    id: 'estradiolFollicular',
    name: 'Estradiol (Follicular)',
    category: 'female-hormones',
    unit: 'pg/mL',
    standardRange: { min: 20, max: 150 },
    direction: 'context',
  },
  progesteroneLuteal: {
    id: 'progesteroneLuteal',
    name: 'Progesterone (Luteal)',
    category: 'female-hormones',
    unit: 'ng/mL',
    standardRange: { min: 5, max: 20 },
    optimalRange: { min: 10 },
    direction: 'higher',
  },
  amh: {
    id: 'amh',
    name: 'AMH',
    category: 'female-hormones',
    unit: 'ng/mL',
    direction: 'higher',
  },

  // ============================================
  // 16. ADVANCED CARDIOVASCULAR (6 markers)
  // ============================================
  lpPla2: {
    id: 'lpPla2',
    name: 'Lp-PLA2 (PLAC)',
    category: 'cardiovascular',
    unit: 'ng/mL',
    standardRange: { max: 200 },
    optimalRange: { max: 200 },
    direction: 'lower',
  },
  mpo: {
    id: 'mpo',
    name: 'MPO (Myeloperoxidase)',
    category: 'cardiovascular',
    unit: 'pmol/L',
    standardRange: { max: 480 },
    optimalRange: { max: 420 },
    direction: 'lower',
  },
  tmao: {
    id: 'tmao',
    name: 'TMAO',
    category: 'cardiovascular',
    unit: 'µmol/L',
    standardRange: { max: 4.6 },
    optimalRange: { max: 2.5 },
    direction: 'lower',
  },
  ntProBnp: {
    id: 'ntProBnp',
    name: 'NT-proBNP',
    category: 'cardiovascular',
    unit: 'pg/mL',
    standardRange: { max: 125 },
    optimalRange: { max: 125 },
    direction: 'lower',
  },
  glycA: {
    id: 'glycA',
    name: 'GlycA',
    category: 'cardiovascular',
    unit: 'µmol/L',
    standardRange: { min: 300, max: 500 },
    direction: 'lower',
  },

  // ============================================
  // 17-21. Additional markers (abbreviated)
  // ============================================

  // Differential counts for ratio calculations
  neutrophils: {
    id: 'neutrophils',
    name: 'Neutrophils (Absolute)',
    category: 'cbc',
    unit: '×10⁹/L',
    standardRange: { min: 1.5, max: 8.0 },
    optimalRange: { min: 2.0, max: 7.0 },
    direction: 'mid-range',
  },
  lymphocytes: {
    id: 'lymphocytes',
    name: 'Lymphocytes (Absolute)',
    category: 'cbc',
    unit: '×10⁹/L',
    standardRange: { min: 1.0, max: 4.8 },
    optimalRange: { min: 1.5, max: 3.5 },
    direction: 'mid-range',
  },
  monocytes: {
    id: 'monocytes',
    name: 'Monocytes (Absolute)',
    category: 'cbc',
    unit: '×10⁹/L',
    standardRange: { min: 0.2, max: 0.8 },
    optimalRange: { min: 0.2, max: 0.6 },
    direction: 'mid-range',
  },
  lymphocytePercent: {
    id: 'lymphocytePercent',
    name: 'Lymphocytes %',
    category: 'cbc',
    unit: '%',
    standardRange: { min: 20, max: 40 },
    optimalRange: { min: 25, max: 35 },
    direction: 'mid-range',
  },
  neutrophilPercent: {
    id: 'neutrophilPercent',
    name: 'Neutrophils %',
    category: 'cbc',
    unit: '%',
    standardRange: { min: 40, max: 70 },
    optimalRange: { min: 45, max: 65 },
    direction: 'mid-range',
  },
  monocytePercent: {
    id: 'monocytePercent',
    name: 'Monocytes %',
    category: 'cbc',
    unit: '%',
    standardRange: { min: 2, max: 8 },
    optimalRange: { min: 3, max: 7 },
    direction: 'mid-range',
  },
  eosinophils: {
    id: 'eosinophils',
    name: 'Eosinophils',
    category: 'cbc',
    unit: '×10⁹/L',
    standardRange: { min: 0, max: 0.5 },
    optimalRange: { min: 0, max: 0.3 },
    direction: 'lower',
  },
  basophils: {
    id: 'basophils',
    name: 'Basophils',
    category: 'cbc',
    unit: '×10⁹/L',
    standardRange: { min: 0, max: 0.2 },
    optimalRange: { min: 0, max: 0.1 },
    direction: 'lower',
  },
  mch: {
    id: 'mch',
    name: 'MCH',
    category: 'cbc',
    unit: 'pg',
    standardRange: { min: 27, max: 33 },
    optimalRange: { min: 28, max: 32 },
    direction: 'mid-range',
  },
  mchc: {
    id: 'mchc',
    name: 'MCHC',
    category: 'cbc',
    unit: 'g/dL',
    standardRange: { min: 32, max: 36 },
    optimalRange: { min: 33, max: 35 },
    direction: 'mid-range',
  },

  // Additional metabolic
  sodium: {
    id: 'sodium',
    name: 'Sodium',
    category: 'metabolic',
    unit: 'mEq/L',
    standardRange: { min: 136, max: 145 },
    optimalRange: { min: 138, max: 142 },
    direction: 'mid-range',
  },
  potassium: {
    id: 'potassium',
    name: 'Potassium',
    category: 'metabolic',
    unit: 'mEq/L',
    standardRange: { min: 3.5, max: 5.0 },
    optimalRange: { min: 4.0, max: 4.5 },
    direction: 'mid-range',
  },
  chloride: {
    id: 'chloride',
    name: 'Chloride',
    category: 'metabolic',
    unit: 'mEq/L',
    standardRange: { min: 98, max: 106 },
    optimalRange: { min: 100, max: 104 },
    direction: 'mid-range',
  },
  co2: {
    id: 'co2',
    name: 'CO2 (Bicarbonate)',
    category: 'metabolic',
    unit: 'mEq/L',
    standardRange: { min: 23, max: 29 },
    optimalRange: { min: 24, max: 28 },
    direction: 'mid-range',
  },
  calcium: {
    id: 'calcium',
    name: 'Calcium',
    category: 'metabolic',
    unit: 'mg/dL',
    standardRange: { min: 8.5, max: 10.5 },
    optimalRange: { min: 9.0, max: 10.0 },
    direction: 'mid-range',
  },
  totalProtein: {
    id: 'totalProtein',
    name: 'Total Protein',
    category: 'liver',
    unit: 'g/dL',
    standardRange: { min: 6.0, max: 8.3 },
    optimalRange: { min: 6.5, max: 7.5 },
    direction: 'mid-range',
  },
  globulin: {
    id: 'globulin',
    name: 'Globulin',
    category: 'liver',
    unit: 'g/dL',
    standardRange: { min: 2.0, max: 3.5 },
    optimalRange: { min: 2.3, max: 3.0 },
    direction: 'mid-range',
  },
};

// Get all biomarker IDs
export const ALL_BIOMARKER_IDS = Object.keys(BIOMARKER_REFERENCES);

// Get biomarkers by category
export function getBiomarkersByCategory(category: string): BiomarkerReference[] {
  return Object.values(BIOMARKER_REFERENCES).filter(b => b.category === category);
}

// Get calculated biomarkers
export function getCalculatedBiomarkers(): BiomarkerReference[] {
  return Object.values(BIOMARKER_REFERENCES).filter(b => b.isCalculated);
}
