export type BiomarkerStatus = 'optimal' | 'normal' | 'borderline' | 'out_of_range';

export interface BiomarkerInfo {
  name: string;
  value: number;
  unit: string;
  status: BiomarkerStatus;
  optimalRange?: string;
}

export interface ReferenceRange {
  optimal?: { min?: number; max?: number };
  normal?: { min?: number; max?: number };
  unit: string;
  displayName: string;
}

export const BIOMARKER_REFERENCES: Record<string, ReferenceRange> = {
  // Levine PhenoAge biomarkers
  albumin: {
    optimal: { min: 4.5, max: 5.0 },
    normal: { min: 3.5, max: 5.5 },
    unit: 'g/dL',
    displayName: 'Albumin',
  },
  creatinine: {
    optimal: { min: 0.7, max: 1.0 },
    normal: { min: 0.6, max: 1.2 },
    unit: 'mg/dL',
    displayName: 'Creatinine',
  },
  glucose: {
    optimal: { min: 70, max: 85 },
    normal: { min: 70, max: 100 },
    unit: 'mg/dL',
    displayName: 'Glucose',
  },
  crp: {
    optimal: { max: 0.5 },
    normal: { max: 3.0 },
    unit: 'mg/L',
    displayName: 'CRP',
  },
  lymphocytePercent: {
    optimal: { min: 25, max: 35 },
    normal: { min: 20, max: 40 },
    unit: '%',
    displayName: 'Lymphocyte %',
  },
  mcv: {
    optimal: { min: 82, max: 92 },
    normal: { min: 80, max: 100 },
    unit: 'fL',
    displayName: 'MCV',
  },
  rdw: {
    optimal: { min: 11.5, max: 13.0 },
    normal: { min: 11.5, max: 14.5 },
    unit: '%',
    displayName: 'RDW',
  },
  alkalinePhosphatase: {
    optimal: { min: 40, max: 70 },
    normal: { min: 44, max: 147 },
    unit: 'U/L',
    displayName: 'Alk Phos',
  },
  wbc: {
    optimal: { min: 4.0, max: 6.0 },
    normal: { min: 4.5, max: 11.0 },
    unit: '10³/µL',
    displayName: 'WBC',
  },

  // Lipid panel
  ldl: {
    optimal: { max: 70 },
    normal: { max: 100 },
    unit: 'mg/dL',
    displayName: 'LDL',
  },
  hdl: {
    optimal: { min: 60 },
    normal: { min: 40 },
    unit: 'mg/dL',
    displayName: 'HDL',
  },
  triglycerides: {
    optimal: { max: 100 },
    normal: { max: 150 },
    unit: 'mg/dL',
    displayName: 'Triglycerides',
  },
  totalCholesterol: {
    optimal: { max: 180 },
    normal: { max: 200 },
    unit: 'mg/dL',
    displayName: 'Total Cholesterol',
  },

  // Additional markers
  vitaminD: {
    optimal: { min: 50, max: 70 },
    normal: { min: 30, max: 100 },
    unit: 'ng/mL',
    displayName: 'Vitamin D',
  },
  hba1c: {
    optimal: { max: 5.2 },
    normal: { max: 5.7 },
    unit: '%',
    displayName: 'HbA1c',
  },
  fastingInsulin: {
    optimal: { min: 2, max: 5 },
    normal: { max: 25 },
    unit: 'µIU/mL',
    displayName: 'Fasting Insulin',
  },
  homocysteine: {
    optimal: { max: 7 },
    normal: { max: 15 },
    unit: 'µmol/L',
    displayName: 'Homocysteine',
  },
  ferritin: {
    optimal: { min: 30, max: 100 },
    normal: { min: 12, max: 300 },
    unit: 'ng/mL',
    displayName: 'Ferritin',
  },

  // Thyroid
  tsh: {
    optimal: { min: 1.0, max: 2.0 },
    normal: { min: 0.4, max: 4.0 },
    unit: 'mIU/L',
    displayName: 'TSH',
  },
  freeT4: {
    optimal: { min: 1.2, max: 1.5 },
    normal: { min: 0.8, max: 1.8 },
    unit: 'ng/dL',
    displayName: 'Free T4',
  },
  freeT3: {
    optimal: { min: 3.0, max: 4.0 },
    normal: { min: 2.3, max: 4.2 },
    unit: 'pg/mL',
    displayName: 'Free T3',
  },

  // Body composition
  bodyFatPercent: {
    optimal: { min: 10, max: 18 },
    normal: { min: 8, max: 25 },
    unit: '%',
    displayName: 'Body Fat',
  },
  visceralFat: {
    optimal: { max: 1.0 },
    normal: { max: 2.0 },
    unit: 'lbs',
    displayName: 'Visceral Fat',
  },
  boneDensityTScore: {
    optimal: { min: 0 },
    normal: { min: -1.0 },
    unit: '',
    displayName: 'Bone Density T-Score',
  },
};

export function getBiomarkerStatus(
  key: string,
  value: number
): BiomarkerStatus {
  const ref = BIOMARKER_REFERENCES[key];
  if (!ref) return 'normal';

  const { optimal, normal } = ref;

  // Check optimal range
  if (optimal) {
    const inOptimal =
      (optimal.min === undefined || value >= optimal.min) &&
      (optimal.max === undefined || value <= optimal.max);
    if (inOptimal) return 'optimal';
  }

  // Check normal range
  if (normal) {
    const inNormal =
      (normal.min === undefined || value >= normal.min) &&
      (normal.max === undefined || value <= normal.max);
    if (inNormal) return 'normal';
  }

  if (normal && isBorderline(value, normal)) {
    return 'borderline';
  }

  return 'out_of_range';
}

function isBorderline(
  value: number,
  normal: { min?: number; max?: number }
): boolean {
  const { min, max } = normal;
  let lower = min;
  let upper = max;

  if (min !== undefined && max !== undefined) {
    if (max < min) return false;
    const buffer = (max - min) * 0.1;
    lower = min - buffer;
    upper = max + buffer;
  } else if (max !== undefined) {
    upper = max + Math.abs(max) * 0.1;
  } else if (min !== undefined) {
    lower = min - Math.max(Math.abs(min) * 0.1, 0.1);
  }

  if (lower !== undefined && value < lower) return false;
  if (upper !== undefined && value > upper) return false;
  return lower !== undefined || upper !== undefined;
}

export function getStatusColor(status: BiomarkerStatus): string {
  switch (status) {
    case 'optimal':
      return 'text-green-600 dark:text-green-400';
    case 'normal':
      return 'text-green-600 dark:text-green-400';
    case 'borderline':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'out_of_range':
      return 'text-red-600 dark:text-red-400';
  }
}

export function getStatusBgColor(status: BiomarkerStatus): string {
  switch (status) {
    case 'optimal':
      return 'bg-green-100 dark:bg-green-900/30';
    case 'normal':
      return 'bg-green-100 dark:bg-green-900/30';
    case 'borderline':
      return 'bg-yellow-100 dark:bg-yellow-900/30';
    case 'out_of_range':
      return 'bg-red-100 dark:bg-red-900/30';
  }
}
