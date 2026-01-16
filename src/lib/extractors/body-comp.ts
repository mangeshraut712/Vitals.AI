export interface BodyComposition {
  // Basic measurements
  bodyFatPercent?: number;
  leanMass?: number; // Total lean tissue in lbs
  fatMass?: number; // Total fat tissue in lbs
  boneMineralContent?: number; // BMC in lbs
  totalMass?: number; // Total body weight in lbs
  height?: number; // Height in inches

  // Regional fat percentages
  armsFatPercent?: number;
  legsFatPercent?: number;
  trunkFatPercent?: number;
  androidFatPercent?: number; // Abdominal region
  gynoidFatPercent?: number; // Hip/thigh region
  agRatio?: number; // Android/Gynoid ratio

  // Regional fat mass (lbs)
  armsFatMass?: number;
  legsFatMass?: number;
  trunkFatMass?: number;
  androidFatMass?: number;
  gynoidFatMass?: number;

  // Regional lean mass (lbs)
  armsLeanMass?: number;
  legsLeanMass?: number;
  trunkLeanMass?: number;

  // Visceral fat (VAT)
  visceralFat?: number; // Alias for vatMass
  vatMass?: number; // lbs
  vatVolume?: number; // cubic inches

  // Bone density
  totalBmd?: number; // g/cm²
  spineBmd?: number;
  boneDensityTScore?: number;
  boneDensityZScore?: number; // Age-matched

  // Metabolic
  restingMetabolicRate?: number; // RMR in cal/day
  almi?: number; // Appendicular Lean Mass Index

  // Muscle balance (left vs right)
  rightArmLean?: number;
  leftArmLean?: number;
  rightLegLean?: number;
  leftLegLean?: number;

  // Patient info
  sex?: 'male' | 'female';
  scanDate?: string; // ISO date string
}

interface BodyCompPattern {
  key: string;
  patterns: RegExp[];
}

const BODY_COMP_PATTERNS: BodyCompPattern[] = [
  {
    key: 'bodyFatPercent',
    patterns: [
      /total body fat[:\s]+(\d+\.?\d*)%?/i,
      /body fat[:\s]+(\d+\.?\d*)%?/i,
    ],
  },
  {
    key: 'leanMass',
    patterns: [
      /total lean mass[:\s]+(\d+\.?\d*)\s*lbs?/i,
      /lean mass[:\s]+(\d+\.?\d*)\s*lbs?/i,
    ],
  },
  {
    key: 'fatMass',
    patterns: [
      /total fat mass[:\s]+(\d+\.?\d*)\s*lbs?/i,
      /fat mass[:\s]+(\d+\.?\d*)\s*lbs?/i,
    ],
  },
  {
    key: 'boneMineralContent',
    patterns: [
      /bone mineral content[:\s]+(\d+\.?\d*)\s*lbs?/i,
      /bmc[:\s]+(\d+\.?\d*)\s*lbs?/i,
    ],
  },
  {
    key: 'visceralFat',
    patterns: [
      /visceral adipose tissue[^:]*[:\s]+(\d+\.?\d*)\s*lbs?/i,
      /vat[:\s]+(\d+\.?\d*)\s*lbs?/i,
      /visceral fat[:\s]+(\d+\.?\d*)\s*lbs?/i,
    ],
  },
  {
    key: 'boneDensityTScore',
    patterns: [
      /whole body t-score[:\s]+(-?\d+\.?\d*)/i,
      /t-score[:\s]+(-?\d+\.?\d*)/i,
      /lumbar spine t-score[:\s]+(-?\d+\.?\d*)/i,
    ],
  },
  {
    key: 'almi',
    patterns: [/almi[:\s]+(\d+\.?\d*)/i],
  },
];

export function extractBodyComposition(text: string): BodyComposition {
  const bodyComp: Record<string, number> = {};

  for (const { key, patterns } of BODY_COMP_PATTERNS) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const value = parseFloat(match[1]);
        if (!isNaN(value)) {
          bodyComp[key] = value;
          break;
        }
      }
    }
  }

  return bodyComp as BodyComposition;
}
