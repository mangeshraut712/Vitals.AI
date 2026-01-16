import { ExtractedBiomarkers } from '@/lib/extractors/biomarkers';

export interface PhenoAgeResult {
  phenoAge: number;
  delta: number;
}

/**
 * Calculate Levine PhenoAge from biomarkers and chronological age.
 *
 * Formula from Levine et al. (2018):
 * "An epigenetic biomarker of aging for lifespan and healthspan"
 * DOI: https://doi.org/10.18632/aging.101414
 *
 * @param biomarkers - Extracted biomarker values
 * @param chronologicalAge - Patient's chronological age in years
 * @returns PhenoAge result or null if missing required biomarkers
 */
export function calculatePhenoAge(
  biomarkers: ExtractedBiomarkers,
  chronologicalAge: number
): PhenoAgeResult | null {
  // Validate all required biomarkers are present
  const {
    albumin,
    creatinine,
    glucose,
    crp,
    lymphocytePercent: rawLymphocytePercent,
    lymphocytes, // absolute count - can derive percentage if needed
    mcv,
    rdw,
    alkalinePhosphatase,
    wbc,
  } = biomarkers;

  // Derive lymphocytePercent from absolute count if not directly available
  // Formula: lymphocytePercent = (lymphocytes / (wbc * 1000)) * 100
  // WBC is in Thousand/uL (K/uL), lymphocytes in cells/uL
  let lymphocytePercent = rawLymphocytePercent;
  const lymphocytesAbsolute = typeof lymphocytes === 'number' ? lymphocytes : undefined;
  if (lymphocytePercent === undefined && lymphocytesAbsolute !== undefined && wbc !== undefined && wbc > 0) {
    // Convert WBC from K/uL to cells/uL for matching units
    const wbcCells = wbc * 1000;
    lymphocytePercent = (lymphocytesAbsolute / wbcCells) * 100;
    console.log(`[PhenoAge] Derived lymphocytePercent from absolute: ${lymphocytesAbsolute} / ${wbcCells} * 100 = ${lymphocytePercent.toFixed(1)}%`);
  }

  // Debug logging
  console.log('[PhenoAge] Input values:', {
    albumin,
    creatinine,
    glucose,
    crp,
    lymphocytePercent,
    mcv,
    rdw,
    alkalinePhosphatase,
    wbc,
    chronologicalAge,
  });

  if (
    albumin === undefined ||
    creatinine === undefined ||
    glucose === undefined ||
    crp === undefined ||
    lymphocytePercent === undefined ||
    mcv === undefined ||
    rdw === undefined ||
    alkalinePhosphatase === undefined ||
    wbc === undefined
  ) {
    console.log('[PhenoAge] Missing required biomarkers, returning null');
    return null;
  }

  // Validate values are in reasonable ranges (sanity check)
  // These are wide ranges to catch unit conversion errors
  const validRanges: Record<string, { min: number; max: number; name: string }> = {
    albumin: { min: 1, max: 10, name: 'Albumin (g/dL)' },
    creatinine: { min: 0.1, max: 15, name: 'Creatinine (mg/dL)' },
    glucose: { min: 40, max: 500, name: 'Glucose (mg/dL)' },
    crp: { min: 0, max: 100, name: 'CRP (mg/L)' },
    lymphocytePercent: { min: 1, max: 80, name: 'Lymphocyte %' },
    mcv: { min: 50, max: 150, name: 'MCV (fL)' },
    rdw: { min: 5, max: 30, name: 'RDW (%)' },
    alkalinePhosphatase: { min: 10, max: 500, name: 'Alk Phos (U/L)' },
    wbc: { min: 1, max: 50, name: 'WBC (10³/µL)' },
  };

  const values: Record<string, number> = {
    albumin,
    creatinine,
    glucose,
    crp,
    lymphocytePercent,
    mcv,
    rdw,
    alkalinePhosphatase,
    wbc,
  };

  for (const [key, value] of Object.entries(values)) {
    const range = validRanges[key];
    if (value < range.min || value > range.max) {
      console.warn(
        `[PhenoAge] ${range.name} value ${value} is outside expected range (${range.min}-${range.max}). ` +
        `This may indicate unit conversion issues.`
      );
    }
  }

  // Handle edge case: CRP <= 0 uses 0.01 to avoid log of zero
  const safeCrp = crp <= 0 ? 0.01 : crp;

  // Convert glucose from mg/dL to mmol/L (Levine coefficients use SI units)
  const glucoseMmol = glucose / 18.02;

  // Step 1: Calculate xb (linear combination)
  // Coefficients from Levine et al. (2018) Table S1
  // xb = -19.9067
  //      - 0.0336 × albumin (g/dL)
  //      + 0.0095 × creatinine (mg/dL)
  //      + 0.1953 × glucose (mmol/L) <-- requires conversion from mg/dL
  //      + 0.0954 × ln(crp) (mg/L)
  //      - 0.0120 × lymphocyte_pct (%)
  //      + 0.0268 × mcv (fL)
  //      + 0.3306 × rdw (%)
  //      + 0.00188 × alp (U/L)
  //      + 0.0554 × wbc (10³/µL)
  //      + 0.0804 × age (years)
  const xb =
    -19.9067 -
    0.0336 * albumin +
    0.0095 * creatinine +
    0.1953 * glucoseMmol +
    0.0954 * Math.log(safeCrp) -
    0.012 * lymphocytePercent +
    0.0268 * mcv +
    0.3306 * rdw +
    0.00188 * alkalinePhosphatase +
    0.0554 * wbc +
    0.0804 * chronologicalAge;

  // Step 2: Calculate mortality risk (m)
  // m = 1 - exp(-exp(xb) × (exp(120 × 0.0077) - 1) / 0.0077)
  const gamma = 0.0077;
  const expXb = Math.exp(xb);
  const m = 1 - Math.exp((-expXb * (Math.exp(120 * gamma) - 1)) / gamma);

  // Step 3: Calculate PhenoAge
  // PhenoAge = 141.50225 + ln(-0.00553 × ln(1 - m)) / 0.090165
  // Guard against m being too close to 1 which causes -Infinity
  const safeMortality = Math.min(m, 0.9999);
  const phenoAge = 141.50225 + Math.log(-0.00553 * Math.log(1 - safeMortality)) / 0.090165;

  // Debug intermediate values
  console.log('[PhenoAge] Calculation:', { glucoseMmol: glucoseMmol.toFixed(2), xb: xb.toFixed(4), expXb, m, safeMortality, phenoAge: phenoAge.toFixed(1) });

  // Clamp to reasonable range (0 to 150 years)
  const clampedPhenoAge = Math.max(0, Math.min(150, phenoAge));

  // Round to 1 decimal place
  const roundedPhenoAge = Math.round(clampedPhenoAge * 10) / 10;

  // Delta = PhenoAge - chronologicalAge (negative = biologically younger)
  const delta = Math.round((roundedPhenoAge - chronologicalAge) * 10) / 10;

  console.log('[PhenoAge] Result:', { roundedPhenoAge, chronologicalAge, delta });

  return {
    phenoAge: roundedPhenoAge,
    delta,
  };
}
