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
    lymphocytePercent,
    mcv,
    rdw,
    alkalinePhosphatase,
    wbc,
  } = biomarkers;

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
    return null;
  }

  // Handle edge case: CRP <= 0 uses 0.01 to avoid log of zero
  const safeCrp = crp <= 0 ? 0.01 : crp;

  // Step 1: Calculate xb (linear combination)
  // xb = -19.9067
  //      - 0.0336 × albumin
  //      + 0.0095 × creatinine
  //      + 0.1953 × glucose
  //      + 0.0954 × ln(crp)
  //      - 0.0120 × lymphocyte_pct
  //      + 0.0268 × mcv
  //      + 0.3306 × rdw
  //      + 0.00188 × alp
  //      + 0.0554 × wbc
  //      + 0.0804 × age
  const xb =
    -19.9067 -
    0.0336 * albumin +
    0.0095 * creatinine +
    0.1953 * glucose +
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
  const phenoAge = 141.50225 + Math.log(-0.00553 * Math.log(1 - m)) / 0.090165;

  // Round to 1 decimal place
  const roundedPhenoAge = Math.round(phenoAge * 10) / 10;

  // Delta = PhenoAge - chronologicalAge (negative = biologically younger)
  const delta = Math.round((roundedPhenoAge - chronologicalAge) * 10) / 10;

  return {
    phenoAge: roundedPhenoAge,
    delta,
  };
}
