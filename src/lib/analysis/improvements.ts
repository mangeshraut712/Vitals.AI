import { ExtractedBiomarkers } from '@/lib/extractors/biomarkers';
import { BodyComposition } from '@/lib/extractors/body-comp';
import {
  BIOMARKER_REFERENCES,
  BiomarkerStatus,
  getBiomarkerStatus,
} from '@/lib/types/health';

export interface Improvement {
  biomarker: string;
  displayName: string;
  currentValue: number;
  unit: string;
  targetValue: string;
  status: BiomarkerStatus;
  recommendation: string;
}

const RECOMMENDATIONS: Record<string, string> = {
  vitaminD:
    'Consider vitamin D3 supplementation (2000-5000 IU daily). Retest in 3 months.',
  ldl: 'Reduce saturated fat intake, increase fiber, and consider plant sterols. Discuss with doctor if ApoB is elevated.',
  hdl: 'Increase aerobic exercise, consume healthy fats (olive oil, avocados), and limit refined carbs.',
  triglycerides:
    'Reduce refined carbs and added sugars. Increase omega-3 fatty acids from fish or supplements.',
  glucose:
    'Focus on reducing refined carbs, increasing fiber intake, and zone 2 aerobic exercise.',
  crp: 'Identify inflammation sources. Increase omega-3s, reduce processed foods. Rule out acute infection.',
  homocysteine:
    'Consider B-vitamin supplementation (B12, folate, B6). Ensure adequate intake of leafy greens.',
  ferritin:
    'If high, consider blood donation. If low, check for iron deficiency or chronic blood loss.',
  hba1c:
    'Monitor glucose patterns. Focus on reducing glycemic load and increasing physical activity.',
  tsh: 'Discuss thyroid function with your doctor. May need further thyroid panel testing.',
  wbc: 'Values outside optimal range may warrant discussion with healthcare provider. Rule out infection or inflammation.',
  rdw: 'Elevated RDW may indicate nutritional deficiencies or chronic conditions. Discuss with doctor.',
  albumin:
    'Low albumin may indicate malnutrition or liver issues. Ensure adequate protein intake.',
  creatinine:
    'Elevated creatinine may indicate kidney function concerns. Stay well hydrated and discuss with doctor.',
  bodyFatPercent:
    'Focus on body recomposition through resistance training and proper nutrition.',
  visceralFat:
    'Reduce visceral fat through aerobic exercise, stress management, and limiting alcohol.',
  boneDensityTScore:
    'Ensure adequate calcium and vitamin D. Include weight-bearing exercises.',
};

function getTargetValue(key: string): string {
  const ref = BIOMARKER_REFERENCES[key];
  if (!ref?.optimal) return 'Consult reference';

  const { min, max } = ref.optimal;
  if (min !== undefined && max !== undefined) {
    return `${min}-${max} ${ref.unit}`;
  }
  if (max !== undefined) {
    return `<${max} ${ref.unit}`;
  }
  if (min !== undefined) {
    return `>${min} ${ref.unit}`;
  }
  return 'Consult reference';
}

export function getImprovements(
  biomarkers: ExtractedBiomarkers,
  bodyComp: BodyComposition
): Improvement[] {
  const improvements: Improvement[] = [];

  // Check biomarkers (excluding patientAge and 'all' array)
  for (const [key, value] of Object.entries(biomarkers)) {
    if (key === 'patientAge' || key === 'all' || value === undefined) continue;
    if (typeof value !== 'number') continue;

    const status = getBiomarkerStatus(key, value);

    // Only include if NOT optimal
    if (status !== 'optimal') {
      const ref = BIOMARKER_REFERENCES[key];
      improvements.push({
        biomarker: key,
        displayName: ref?.displayName ?? key,
        currentValue: value,
        unit: ref?.unit ?? '',
        targetValue: getTargetValue(key),
        status,
        recommendation:
          RECOMMENDATIONS[key] ?? 'Discuss with your healthcare provider.',
      });
    }
  }

  // Check body composition
  for (const [key, value] of Object.entries(bodyComp)) {
    if (value === undefined) continue;

    const status = getBiomarkerStatus(key, value);

    if (status !== 'optimal') {
      const ref = BIOMARKER_REFERENCES[key];
      if (ref) {
        improvements.push({
          biomarker: key,
          displayName: ref.displayName,
          currentValue: value,
          unit: ref.unit,
          targetValue: getTargetValue(key),
          status,
          recommendation:
            RECOMMENDATIONS[key] ?? 'Discuss with your healthcare provider.',
        });
      }
    }
  }

  // Sort by severity: out_of_range first, then borderline, then normal
  const statusOrder: Record<BiomarkerStatus, number> = {
    out_of_range: 0,
    borderline: 1,
    normal: 2,
    optimal: 3,
  };

  improvements.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

  return improvements;
}
