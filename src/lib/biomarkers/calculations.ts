// Biomarker Calculation Engine
// Computes derived biomarkers from raw lab values

import { BIOMARKER_REFERENCES } from './reference';

export interface RawBiomarkers {
  [key: string]: number | undefined;
}

export interface CalculatedBiomarker {
  id: string;
  name: string;
  value: number;
  unit: string;
  formula: string;
  inputs: string[];
}

/**
 * Calculate all derived biomarkers from raw values
 */
export function calculateDerivedBiomarkers(raw: RawBiomarkers): CalculatedBiomarker[] {
  const calculated: CalculatedBiomarker[] = [];

  // ============================================
  // LIPID RATIOS
  // ============================================

  // TC/HDL Ratio (Castelli Index)
  if (raw.totalCholesterol && raw.hdl) {
    calculated.push({
      id: 'tcHdlRatio',
      name: 'TC/HDL Ratio',
      value: round(raw.totalCholesterol / raw.hdl, 2),
      unit: 'ratio',
      formula: 'Total Cholesterol ÷ HDL',
      inputs: ['totalCholesterol', 'hdl'],
    });
  }

  // LDL/HDL Ratio
  if (raw.ldl && raw.hdl) {
    calculated.push({
      id: 'ldlHdlRatio',
      name: 'LDL/HDL Ratio',
      value: round(raw.ldl / raw.hdl, 2),
      unit: 'ratio',
      formula: 'LDL ÷ HDL',
      inputs: ['ldl', 'hdl'],
    });
  }

  // TG/HDL Ratio (Insulin Resistance proxy)
  if (raw.triglycerides && raw.hdl) {
    calculated.push({
      id: 'tgHdlRatio',
      name: 'TG/HDL Ratio',
      value: round(raw.triglycerides / raw.hdl, 2),
      unit: 'ratio',
      formula: 'Triglycerides ÷ HDL',
      inputs: ['triglycerides', 'hdl'],
    });
  }

  // Atherogenic Index of Plasma (requires mmol/L conversion)
  if (raw.triglycerides && raw.hdl) {
    // Convert mg/dL to mmol/L: TG ÷ 88.57, HDL ÷ 38.67
    const tgMmol = raw.triglycerides / 88.57;
    const hdlMmol = raw.hdl / 38.67;
    const aip = Math.log10(tgMmol / hdlMmol);
    calculated.push({
      id: 'atherogenicIndex',
      name: 'Atherogenic Index of Plasma',
      value: round(aip, 3),
      unit: 'index',
      formula: 'log₁₀(TG/HDL) [mmol/L]',
      inputs: ['triglycerides', 'hdl'],
    });
  }

  // Non-HDL Cholesterol
  if (raw.totalCholesterol && raw.hdl) {
    calculated.push({
      id: 'nonHdlC',
      name: 'Non-HDL-C',
      value: round(raw.totalCholesterol - raw.hdl, 0),
      unit: 'mg/dL',
      formula: 'TC − HDL',
      inputs: ['totalCholesterol', 'hdl'],
    });
  }

  // Remnant Cholesterol
  if (raw.totalCholesterol && raw.hdl && raw.ldl) {
    calculated.push({
      id: 'remnantCholesterol',
      name: 'Remnant Cholesterol',
      value: round(raw.totalCholesterol - raw.hdl - raw.ldl, 0),
      unit: 'mg/dL',
      formula: 'TC − HDL − LDL',
      inputs: ['totalCholesterol', 'hdl', 'ldl'],
    });
  }

  // Atherogenic Coefficient
  if (raw.totalCholesterol && raw.hdl && raw.hdl > 0) {
    calculated.push({
      id: 'atherogenicCoeff',
      name: 'Atherogenic Coefficient',
      value: round((raw.totalCholesterol - raw.hdl) / raw.hdl, 2),
      unit: 'ratio',
      formula: '(TC − HDL) ÷ HDL',
      inputs: ['totalCholesterol', 'hdl'],
    });
  }

  // LDL/ApoB Ratio
  if (raw.ldl && raw.apoB && raw.apoB > 0) {
    calculated.push({
      id: 'ldlApoBRatio',
      name: 'LDL/ApoB Ratio',
      value: round(raw.ldl / raw.apoB, 2),
      unit: 'ratio',
      formula: 'LDL ÷ ApoB',
      inputs: ['ldl', 'apoB'],
    });
  }

  // Non-HDL/ApoB Ratio
  if (raw.totalCholesterol && raw.hdl && raw.apoB && raw.apoB > 0) {
    const nonHdl = raw.totalCholesterol - raw.hdl;
    calculated.push({
      id: 'nonHdlApoBRatio',
      name: 'Non-HDL/ApoB Ratio',
      value: round(nonHdl / raw.apoB, 2),
      unit: 'ratio',
      formula: '(TC − HDL) ÷ ApoB',
      inputs: ['totalCholesterol', 'hdl', 'apoB'],
    });
  }

  // TG/ApoB Ratio
  if (raw.triglycerides && raw.apoB && raw.apoB > 0) {
    calculated.push({
      id: 'tgApoBRatio',
      name: 'TG/ApoB Ratio',
      value: round(raw.triglycerides / raw.apoB, 2),
      unit: 'ratio',
      formula: 'TG ÷ ApoB',
      inputs: ['triglycerides', 'apoB'],
    });
  }

  // LDL/TC Ratio
  if (raw.ldl && raw.totalCholesterol && raw.totalCholesterol > 0) {
    calculated.push({
      id: 'ldlTcRatio',
      name: 'LDL/TC Ratio',
      value: round(raw.ldl / raw.totalCholesterol, 2),
      unit: 'ratio',
      formula: 'LDL ÷ TC',
      inputs: ['ldl', 'totalCholesterol'],
    });
  }

  // Non-HDL/TC Ratio
  if (raw.totalCholesterol && raw.hdl && raw.totalCholesterol > 0) {
    const nonHdl = raw.totalCholesterol - raw.hdl;
    calculated.push({
      id: 'nonHdlTcRatio',
      name: 'Non-HDL/TC Ratio',
      value: round(nonHdl / raw.totalCholesterol, 2),
      unit: 'ratio',
      formula: '(TC − HDL) ÷ TC',
      inputs: ['totalCholesterol', 'hdl'],
    });
  }

  // ============================================
  // INSULIN SENSITIVITY CALCULATIONS
  // ============================================

  // HOMA-IR
  if (raw.fastingInsulin && raw.glucose) {
    const homaIr = (raw.fastingInsulin * raw.glucose) / 405;
    calculated.push({
      id: 'homaIr',
      name: 'HOMA-IR',
      value: round(homaIr, 2),
      unit: 'index',
      formula: '(Fasting Insulin × Glucose) ÷ 405',
      inputs: ['fastingInsulin', 'glucose'],
    });
  }

  // QUICKI
  if (raw.fastingInsulin && raw.glucose && raw.fastingInsulin > 0 && raw.glucose > 0) {
    const quicki = 1 / (Math.log10(raw.fastingInsulin) + Math.log10(raw.glucose));
    calculated.push({
      id: 'quicki',
      name: 'QUICKI',
      value: round(quicki, 3),
      unit: 'index',
      formula: '1 ÷ (log₁₀(Insulin) + log₁₀(Glucose))',
      inputs: ['fastingInsulin', 'glucose'],
    });
  }

  // TyG Index
  if (raw.triglycerides && raw.glucose) {
    const tyg = Math.log((raw.triglycerides * raw.glucose) / 2);
    calculated.push({
      id: 'tygIndex',
      name: 'TyG Index',
      value: round(tyg, 2),
      unit: 'index',
      formula: 'Ln[(TG × Glucose) ÷ 2]',
      inputs: ['triglycerides', 'glucose'],
    });
  }

  // ============================================
  // LIVER RATIOS
  // ============================================

  // De Ritis Ratio (AST/ALT)
  if (raw.ast && raw.alt && raw.alt > 0) {
    calculated.push({
      id: 'deRitisRatio',
      name: 'AST:ALT (De Ritis)',
      value: round(raw.ast / raw.alt, 2),
      unit: 'ratio',
      formula: 'AST ÷ ALT',
      inputs: ['ast', 'alt'],
    });
  }

  // A/G Ratio
  if (raw.albumin && raw.globulin && raw.globulin > 0) {
    calculated.push({
      id: 'agRatio',
      name: 'A/G Ratio',
      value: round(raw.albumin / raw.globulin, 2),
      unit: 'ratio',
      formula: 'Albumin ÷ Globulin',
      inputs: ['albumin', 'globulin'],
    });
  }

  // Bilirubin-to-Albumin Ratio
  if (raw.totalBilirubin && raw.albumin && raw.albumin > 0) {
    calculated.push({
      id: 'bilirubinAlbuminRatio',
      name: 'Bilirubin/Albumin Ratio',
      value: round(raw.totalBilirubin / raw.albumin, 3),
      unit: 'ratio',
      formula: 'Total Bilirubin ÷ Albumin',
      inputs: ['totalBilirubin', 'albumin'],
    });
  }

  // Indirect/Direct Bilirubin Ratio
  if (raw.indirectBilirubin && raw.directBilirubin && raw.directBilirubin > 0) {
    calculated.push({
      id: 'indirectDirectBilirubin',
      name: 'Indirect/Direct Bilirubin',
      value: round(raw.indirectBilirubin / raw.directBilirubin, 1),
      unit: 'ratio',
      formula: 'Indirect Bilirubin ÷ Direct Bilirubin',
      inputs: ['indirectBilirubin', 'directBilirubin'],
    });
  }

  // ============================================
  // KIDNEY RATIOS
  // ============================================

  // BUN/Creatinine Ratio
  if (raw.bun && raw.creatinine && raw.creatinine > 0) {
    calculated.push({
      id: 'bunCreatinineRatio',
      name: 'BUN/Creatinine Ratio',
      value: round(raw.bun / raw.creatinine, 1),
      unit: 'ratio',
      formula: 'BUN ÷ Creatinine',
      inputs: ['bun', 'creatinine'],
    });
  }

  // ============================================
  // CBC INFLAMMATION RATIOS
  // ============================================

  // NLR (Neutrophil-to-Lymphocyte Ratio)
  // Can use absolute counts or calculate from percentages and WBC
  const neutrophils = raw.neutrophils ?? (raw.neutrophilPercent && raw.wbc ? (raw.neutrophilPercent / 100) * raw.wbc : undefined);
  const lymphocytes = raw.lymphocytes ?? (raw.lymphocytePercent && raw.wbc ? (raw.lymphocytePercent / 100) * raw.wbc : undefined);
  const monocytes = raw.monocytes ?? (raw.monocytePercent && raw.wbc ? (raw.monocytePercent / 100) * raw.wbc : undefined);

  if (neutrophils && lymphocytes && lymphocytes > 0) {
    calculated.push({
      id: 'nlr',
      name: 'NLR (Neutrophil/Lymphocyte)',
      value: round(neutrophils / lymphocytes, 2),
      unit: 'ratio',
      formula: 'Neutrophils ÷ Lymphocytes',
      inputs: ['neutrophils', 'lymphocytes'],
    });
  }

  // PLR (Platelet-to-Lymphocyte Ratio)
  // Platelets in ×10³/µL, Lymphocytes in cells/µL
  // Multiply platelets by 1000 to get same units
  if (raw.platelets && lymphocytes && lymphocytes > 0) {
    const plr = (raw.platelets * 1000) / lymphocytes;
    calculated.push({
      id: 'plr',
      name: 'PLR (Platelet/Lymphocyte)',
      value: round(plr, 0),
      unit: 'ratio',
      formula: '(Platelets × 1000) ÷ Lymphocytes',
      inputs: ['platelets', 'lymphocytes'],
    });
  }

  // MLR (Monocyte-to-Lymphocyte Ratio)
  if (monocytes && lymphocytes && lymphocytes > 0) {
    calculated.push({
      id: 'mlr',
      name: 'MLR (Monocyte/Lymphocyte)',
      value: round(monocytes / lymphocytes, 2),
      unit: 'ratio',
      formula: 'Monocytes ÷ Lymphocytes',
      inputs: ['monocytes', 'lymphocytes'],
    });
  }

  // SII (Systemic Immune-Inflammation Index)
  if (raw.platelets && neutrophils && lymphocytes && lymphocytes > 0) {
    const sii = (raw.platelets * neutrophils) / lymphocytes;
    calculated.push({
      id: 'sii',
      name: 'SII (Immune-Inflammation Index)',
      value: round(sii, 0),
      unit: 'index',
      formula: '(Platelets × Neutrophils) ÷ Lymphocytes',
      inputs: ['platelets', 'neutrophils', 'lymphocytes'],
    });
  }

  // SIRI (Systemic Inflammation Response Index)
  // Formula: (Mono × Neut) / (Lymph × 1000) when values in cells/µL
  // This converts to ×10³/µL units for proper ratio
  if (monocytes && neutrophils && lymphocytes && lymphocytes > 0) {
    const siri = (monocytes * neutrophils) / (lymphocytes * 1000);
    calculated.push({
      id: 'siri',
      name: 'SIRI (Inflammation Response Index)',
      value: round(siri, 2),
      unit: 'index',
      formula: '(Monocytes × Neutrophils) ÷ (Lymphocytes × 1000)',
      inputs: ['monocytes', 'neutrophils', 'lymphocytes'],
    });
  }

  // LMR (Lymphocyte-to-Monocyte Ratio) - inverse of MLR
  if (lymphocytes && monocytes && monocytes > 0) {
    calculated.push({
      id: 'lmr',
      name: 'LMR (Lymphocyte/Monocyte)',
      value: round(lymphocytes / monocytes, 2),
      unit: 'ratio',
      formula: 'Lymphocytes ÷ Monocytes',
      inputs: ['lymphocytes', 'monocytes'],
    });
  }

  // PWR (Platelet-to-WBC Ratio)
  if (raw.platelets && raw.wbc && raw.wbc > 0) {
    calculated.push({
      id: 'pwr',
      name: 'PWR (Platelet/WBC)',
      value: round(raw.platelets / raw.wbc, 1),
      unit: 'ratio',
      formula: 'Platelets ÷ WBC',
      inputs: ['platelets', 'wbc'],
    });
  }

  // ============================================
  // LIPID-INFLAMMATION RATIOS
  // ============================================

  // MHR (Monocyte-to-HDL Ratio)
  // Monocytes in cells/µL (×10³), HDL in mg/dL
  if (monocytes && raw.hdl && raw.hdl > 0) {
    // Convert monocytes from cells/µL to ×10³/µL for standard MHR calculation
    const monocytesK = monocytes / 1000;
    calculated.push({
      id: 'mhr',
      name: 'MHR (Monocyte/HDL)',
      value: round(monocytesK / raw.hdl, 4),
      unit: 'ratio',
      formula: '(Monocytes ÷ 1000) ÷ HDL',
      inputs: ['monocytes', 'hdl'],
    });
  }

  // NHR (Neutrophil-to-HDL Ratio)
  // Neutrophils in cells/µL (×10³), HDL in mg/dL
  if (neutrophils && raw.hdl && raw.hdl > 0) {
    // Convert neutrophils from cells/µL to ×10³/µL
    const neutrophilsK = neutrophils / 1000;
    calculated.push({
      id: 'nhr',
      name: 'NHR (Neutrophil/HDL)',
      value: round(neutrophilsK / raw.hdl, 4),
      unit: 'ratio',
      formula: '(Neutrophils ÷ 1000) ÷ HDL',
      inputs: ['neutrophils', 'hdl'],
    });
  }

  // GGT/HDL Ratio (metabolic health marker)
  if (raw.ggt && raw.hdl && raw.hdl > 0) {
    calculated.push({
      id: 'ggtHdlRatio',
      name: 'GGT/HDL Ratio',
      value: round(raw.ggt / raw.hdl, 2),
      unit: 'ratio',
      formula: 'GGT ÷ HDL',
      inputs: ['ggt', 'hdl'],
    });
  }

  // ============================================
  // INFLAMMATION MARKERS
  // ============================================

  // CAR (CRP-to-Albumin Ratio) - inflammation/nutrition marker
  if (raw.crp && raw.albumin && raw.albumin > 0) {
    calculated.push({
      id: 'car',
      name: 'CAR (CRP/Albumin)',
      value: round(raw.crp / raw.albumin, 3),
      unit: 'ratio',
      formula: 'CRP ÷ Albumin',
      inputs: ['crp', 'albumin'],
    });
  }

  // Ferritin/Albumin Ratio - inflammation marker
  if (raw.ferritin && raw.albumin && raw.albumin > 0) {
    calculated.push({
      id: 'ferritinAlbuminRatio',
      name: 'Ferritin/Albumin Ratio',
      value: round(raw.ferritin / raw.albumin, 1),
      unit: 'ratio',
      formula: 'Ferritin ÷ Albumin',
      inputs: ['ferritin', 'albumin'],
    });
  }

  // ============================================
  // CBC CELL SIZE RATIOS
  // ============================================

  // RDW/MCV Ratio - anemia differentiation
  if (raw.rdw && raw.mcv && raw.mcv > 0) {
    calculated.push({
      id: 'rdwMcvRatio',
      name: 'RDW/MCV Ratio',
      value: round(raw.rdw / raw.mcv, 3),
      unit: 'ratio',
      formula: 'RDW ÷ MCV',
      inputs: ['rdw', 'mcv'],
    });
  }

  // NLPR (NLR-Platelet Ratio)
  // Requires NLR calculated first - use neutrophils/lymphocytes
  if (neutrophils && lymphocytes && lymphocytes > 0 && raw.platelets) {
    const nlrValue = neutrophils / lymphocytes;
    const nlpr = nlrValue / (raw.platelets / 100);
    calculated.push({
      id: 'nlpr',
      name: 'NLPR (NLR-Platelet Ratio)',
      value: round(nlpr, 2),
      unit: 'ratio',
      formula: 'NLR ÷ (Platelets ÷ 100)',
      inputs: ['neutrophils', 'lymphocytes', 'platelets'],
    });
  }

  // ============================================
  // METABOLIC RATIOS
  // ============================================

  // Uric Acid-to-HDL Ratio
  if (raw.uricAcid && raw.hdl && raw.hdl > 0) {
    calculated.push({
      id: 'uricAcidHdlRatio',
      name: 'Uric Acid/HDL Ratio',
      value: round(raw.uricAcid / raw.hdl, 3),
      unit: 'ratio',
      formula: 'Uric Acid ÷ HDL',
      inputs: ['uricAcid', 'hdl'],
    });
  }

  // Corrected Calcium (adjusts for albumin levels)
  // Formula: Ca + 0.8 × (4.0 − Albumin)
  if (raw.calcium && raw.albumin) {
    const correctedCa = raw.calcium + 0.8 * (4.0 - raw.albumin);
    calculated.push({
      id: 'correctedCalcium',
      name: 'Corrected Calcium',
      value: round(correctedCa, 1),
      unit: 'mg/dL',
      formula: 'Ca + 0.8 × (4.0 − Albumin)',
      inputs: ['calcium', 'albumin'],
    });
  }

  // ============================================
  // HORMONE RATIOS
  // ============================================

  // Testosterone/Estradiol Ratio (Male)
  if (raw.totalTestosterone && raw.estradiol && raw.estradiol > 0) {
    calculated.push({
      id: 'testosteroneEstradiolRatio',
      name: 'Testosterone/Estradiol Ratio',
      value: round(raw.totalTestosterone / raw.estradiol, 1),
      unit: 'ratio',
      formula: 'Total Testosterone (ng/dL) ÷ Estradiol (pg/mL)',
      inputs: ['totalTestosterone', 'estradiol'],
    });
  }

  // Free Androgen Index (FAI)
  // Total T must be converted from ng/dL to nmol/L: multiply by 0.0347
  if (raw.totalTestosterone && raw.shbg && raw.shbg > 0) {
    const tNmol = raw.totalTestosterone * 0.0347;
    const fai = (tNmol * 100) / raw.shbg;
    calculated.push({
      id: 'freeAndrogenIndex',
      name: 'Free Androgen Index (FAI)',
      value: round(fai, 1),
      unit: 'index',
      formula: '(Total T [nmol/L] × 100) ÷ SHBG',
      inputs: ['totalTestosterone', 'shbg'],
    });
  }

  // ============================================
  // THYROID RATIOS
  // ============================================

  // FT3/rT3 Ratio
  if (raw.freeT3 && raw.reverseT3 && raw.reverseT3 > 0) {
    calculated.push({
      id: 'ft3Rt3Ratio',
      name: 'FT3/rT3 Ratio',
      value: round(raw.freeT3 / raw.reverseT3, 2),
      unit: 'ratio',
      formula: 'Free T3 ÷ Reverse T3',
      inputs: ['freeT3', 'reverseT3'],
    });
  }

  // ============================================
  // MINERAL RATIOS
  // ============================================

  // Copper/Zinc Ratio
  if (raw.copper && raw.zinc && raw.zinc > 0) {
    calculated.push({
      id: 'copperZincRatio',
      name: 'Copper/Zinc Ratio',
      value: round(raw.copper / raw.zinc, 2),
      unit: 'ratio',
      formula: 'Copper ÷ Zinc',
      inputs: ['copper', 'zinc'],
    });
  }

  return calculated;
}

/**
 * Merge raw biomarkers with calculated values
 */
export function mergeWithCalculated(raw: RawBiomarkers): RawBiomarkers {
  const calculated = calculateDerivedBiomarkers(raw);
  const merged = { ...raw };

  for (const calc of calculated) {
    merged[calc.id] = calc.value;
  }

  return merged;
}

/**
 * Get the reference for a biomarker by ID or name
 */
export function getBiomarkerReference(idOrName: string) {
  // Try direct ID lookup
  if (BIOMARKER_REFERENCES[idOrName]) {
    return BIOMARKER_REFERENCES[idOrName];
  }

  // Try case-insensitive name match
  const normalized = idOrName.toLowerCase().trim();
  for (const ref of Object.values(BIOMARKER_REFERENCES)) {
    if (ref.name.toLowerCase() === normalized) {
      return ref;
    }
  }

  return undefined;
}

/**
 * Determine status based on value and reference
 */
export function getBiomarkerStatus(
  id: string,
  value: number
): 'optimal' | 'normal' | 'borderline' | 'out_of_range' {
  const ref = BIOMARKER_REFERENCES[id];
  if (!ref) return 'normal';

  const { optimalRange, standardRange, direction } = ref;

  // Check optimal range
  if (optimalRange) {
    const inOptimal = isInRange(value, optimalRange);
    if (inOptimal) return 'optimal';
  }

  // Check standard range
  if (standardRange) {
    const inStandard = isInRange(value, standardRange);
    if (!inStandard) return 'out_of_range';
  }

  // Determine if borderline (within standard but outside optimal)
  if (optimalRange && standardRange) {
    // Has both ranges and is in standard but not optimal
    return 'borderline';
  }

  // Check direction-based assessment
  if (direction === 'lower' && optimalRange?.max) {
    if (value > optimalRange.max * 1.2) return 'out_of_range';
    if (value > optimalRange.max) return 'borderline';
    return 'optimal';
  }

  if (direction === 'higher' && optimalRange?.min) {
    if (value < optimalRange.min * 0.8) return 'out_of_range';
    if (value < optimalRange.min) return 'borderline';
    return 'optimal';
  }

  return 'normal';
}

function isInRange(value: number, range: { min?: number; max?: number }): boolean {
  if (range.min !== undefined && value < range.min) return false;
  if (range.max !== undefined && value > range.max) return false;
  return true;
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
