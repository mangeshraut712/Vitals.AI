import { ExtractedBiomarkers } from '@/lib/extractors/biomarkers';

export interface PhenoAgeResult {
  phenoAge: number;
  delta: number;
}

const ALBUMIN_G_PER_DL = 10;
const CREATININE_UMOL_PER_MG_DL = 88.4;
const GLUCOSE_MG_DL_PER_MMOL = 18.0182;
const CRP_MG_L_PER_MG_DL = 10;
const GOMPERTZ_GAMMA = 0.0076927;
const MORTALITY_HORIZON_MONTHS = 120;

/**
 * Calculate Levine PhenoAge from biomarkers and chronological age.
 *
 * Coefficients are from Levine et al. (2018), DOI 10.18632/aging.101414.
 * The published fit uses albumin in g/L, creatinine in µmol/L, glucose in
 * mmol/L, and the natural log of CRP in mg/dL. This function accepts the
 * US lab units stored by the extractors (g/dL, mg/dL, mg/dL, mg/L).
 */
export function calculatePhenoAge(
  biomarkers: ExtractedBiomarkers,
  chronologicalAge: number
): PhenoAgeResult | null {
  if (!Number.isFinite(chronologicalAge) || chronologicalAge < 0 || chronologicalAge > 130) {
    return null;
  }

  const {
    albumin,
    creatinine,
    glucose,
    crp,
    lymphocytePercent: rawLymphocytePercent,
    lymphocytes,
    mcv,
    rdw,
    alkalinePhosphatase,
    wbc,
  } = biomarkers;

  let lymphocytePercent = rawLymphocytePercent;
  if (
    lymphocytePercent === undefined &&
    typeof lymphocytes === 'number' &&
    typeof wbc === 'number' &&
    wbc > 0
  ) {
    lymphocytePercent = (lymphocytes / (wbc * 1000)) * 100;
  }

  const albuminValue = finiteNumber(albumin);
  const creatinineValue = finiteNumber(creatinine);
  const glucoseValue = finiteNumber(glucose);
  const crpValue = finiteNumber(crp);
  const lymphocyteValue = finiteNumber(lymphocytePercent);
  const mcvValue = finiteNumber(mcv);
  const rdwValue = finiteNumber(rdw);
  const alkalinePhosphataseValue = finiteNumber(alkalinePhosphatase);
  const wbcValue = finiteNumber(wbc);

  if (
    albuminValue === null ||
    creatinineValue === null ||
    glucoseValue === null ||
    crpValue === null ||
    lymphocyteValue === null ||
    mcvValue === null ||
    rdwValue === null ||
    alkalinePhosphataseValue === null ||
    wbcValue === null
  ) {
    return null;
  }

  const albuminGL = albuminValue * ALBUMIN_G_PER_DL;
  const creatinineUmol = creatinineValue * CREATININE_UMOL_PER_MG_DL;
  const glucoseMmol = glucoseValue / GLUCOSE_MG_DL_PER_MMOL;
  const crpMgDl = Math.max(crpValue, 0) / CRP_MG_L_PER_MG_DL;
  const safeCrp = crpMgDl > 0 ? crpMgDl : 0.01;

  const xb =
    -19.9067 -
    0.0336 * albuminGL +
    0.0095 * creatinineUmol +
    0.1953 * glucoseMmol +
    0.0954 * Math.log(safeCrp) -
    0.012 * lymphocyteValue +
    0.0268 * mcvValue +
    0.3306 * rdwValue +
    0.00188 * alkalinePhosphataseValue +
    0.0554 * wbcValue +
    0.0804 * chronologicalAge;

  const expXb = Math.exp(xb);
  const mortality =
    1 -
    Math.exp(
      (-expXb * (Math.exp(MORTALITY_HORIZON_MONTHS * GOMPERTZ_GAMMA) - 1)) / GOMPERTZ_GAMMA
    );

  if (!Number.isFinite(mortality) || mortality <= 0 || mortality >= 1) {
    return null;
  }

  const phenoAge = 141.50225 + Math.log(-0.00553 * Math.log(1 - mortality)) / 0.090165;
  if (!Number.isFinite(phenoAge)) return null;

  const roundedPhenoAge = Math.round(Math.max(0, Math.min(150, phenoAge)) * 10) / 10;
  const delta = Math.round((roundedPhenoAge - chronologicalAge) * 10) / 10;

  return {
    phenoAge: roundedPhenoAge,
    delta,
  };
}

function finiteNumber(value: number | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
