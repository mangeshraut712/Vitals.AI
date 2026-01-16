import { getBiomarkerStatus, BIOMARKER_REFERENCES, type BiomarkerStatus } from '@/lib/types/health';
import type { ExtractedBiomarkers } from '@/lib/extractors/biomarkers';
import type { PhenoAgeResult } from '@/lib/calculations/phenoage';
import type { BodyComposition } from '@/lib/extractors/body-comp';

export type GoalPriority = 'high' | 'medium' | 'low';

export interface Goal {
  id: string;
  title: string;
  description: string;
  priority: GoalPriority;
  category: string;
  actionItems: string[];
  biomarkerKey?: string;
  currentValue?: number;
  targetValue?: string;
}

interface GoalTemplate {
  biomarkerKey: string;
  title: string;
  description: string;
  category: string;
  actionItems: string[];
  priorityIfOutOfRange: GoalPriority;
  priorityIfBorderline: GoalPriority;
}

// Templates for goals based on biomarkers
const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    biomarkerKey: 'ldl',
    title: 'Lower artery-clogging cholesterol',
    description: 'High LDL cholesterol increases risk of heart disease. Focus on diet and lifestyle changes.',
    category: 'Cardiovascular',
    actionItems: [
      'Reduce saturated fat intake (red meat, full-fat dairy)',
      'Increase soluble fiber (oats, beans, fruits)',
      'Add plant sterols to diet',
      'Exercise 150+ min/week of moderate cardio',
      'Consider fish oil supplements',
    ],
    priorityIfOutOfRange: 'high',
    priorityIfBorderline: 'medium',
  },
  {
    biomarkerKey: 'glucose',
    title: 'Optimize blood sugar control',
    description: 'Elevated fasting glucose can indicate insulin resistance. Address through diet and exercise.',
    category: 'Metabolic',
    actionItems: [
      'Reduce refined carbs and sugars',
      'Eat more protein and healthy fats',
      'Walk after meals to lower glucose spikes',
      'Strength training 2-3x/week',
      'Consider berberine or metformin (consult doctor)',
    ],
    priorityIfOutOfRange: 'high',
    priorityIfBorderline: 'medium',
  },
  {
    biomarkerKey: 'crp',
    title: 'Reduce systemic inflammation',
    description: 'Elevated CRP indicates chronic inflammation, linked to many diseases.',
    category: 'Inflammation',
    actionItems: [
      'Eliminate processed foods and seed oils',
      'Eat fatty fish 2-3x/week',
      'Add turmeric/curcumin to diet',
      'Prioritize quality sleep (7-8 hours)',
      'Manage stress with meditation or exercise',
    ],
    priorityIfOutOfRange: 'high',
    priorityIfBorderline: 'medium',
  },
  {
    biomarkerKey: 'hdl',
    title: 'Boost protective HDL cholesterol',
    description: 'Low HDL reduces your body\'s ability to clear LDL from arteries.',
    category: 'Cardiovascular',
    actionItems: [
      'Increase aerobic exercise intensity',
      'Add healthy fats (olive oil, avocado, nuts)',
      'Moderate alcohol may help (1 drink/day)',
      'Quit smoking if applicable',
      'Consider niacin supplements (consult doctor)',
    ],
    priorityIfOutOfRange: 'high',
    priorityIfBorderline: 'low',
  },
  {
    biomarkerKey: 'triglycerides',
    title: 'Lower triglyceride levels',
    description: 'High triglycerides increase cardiovascular risk and often indicate metabolic issues.',
    category: 'Cardiovascular',
    actionItems: [
      'Cut sugar and refined carbs drastically',
      'Limit alcohol consumption',
      'Eat fatty fish or take omega-3s',
      'Lose excess body fat',
      'Exercise regularly',
    ],
    priorityIfOutOfRange: 'high',
    priorityIfBorderline: 'medium',
  },
  {
    biomarkerKey: 'vitaminD',
    title: 'Optimize vitamin D levels',
    description: 'Low vitamin D affects bone health, immune function, and mood.',
    category: 'Vitamins',
    actionItems: [
      'Get 15-20 min of midday sun exposure',
      'Supplement with D3 (2000-5000 IU/day)',
      'Take with fat for better absorption',
      'Eat vitamin D rich foods (fatty fish, eggs)',
      'Retest in 3 months',
    ],
    priorityIfOutOfRange: 'medium',
    priorityIfBorderline: 'low',
  },
  {
    biomarkerKey: 'hba1c',
    title: 'Improve long-term blood sugar',
    description: 'Elevated HbA1c shows average blood sugar over 3 months. Indicates diabetes risk.',
    category: 'Metabolic',
    actionItems: [
      'Adopt low-carb or Mediterranean diet',
      'Time-restricted eating (16:8 fasting)',
      'Regular exercise, especially after meals',
      'Monitor blood glucose regularly',
      'Work with doctor on medication if needed',
    ],
    priorityIfOutOfRange: 'high',
    priorityIfBorderline: 'medium',
  },
  {
    biomarkerKey: 'homocysteine',
    title: 'Lower homocysteine levels',
    description: 'High homocysteine is linked to cardiovascular disease and cognitive decline.',
    category: 'Cardiovascular',
    actionItems: [
      'Supplement with B12, B6, and folate',
      'Eat leafy greens and legumes',
      'Reduce red meat consumption',
      'Consider methylated B vitamins',
      'Check for MTHFR gene variants',
    ],
    priorityIfOutOfRange: 'medium',
    priorityIfBorderline: 'low',
  },
  {
    biomarkerKey: 'ferritin',
    title: 'Optimize iron stores',
    description: 'Ferritin out of range can indicate iron deficiency or overload.',
    category: 'Blood',
    actionItems: [
      'If low: eat iron-rich foods with vitamin C',
      'If high: donate blood regularly',
      'Avoid excessive red meat and supplements',
      'Get full iron panel tested',
      'Rule out underlying conditions',
    ],
    priorityIfOutOfRange: 'medium',
    priorityIfBorderline: 'low',
  },
  {
    biomarkerKey: 'tsh',
    title: 'Optimize thyroid function',
    description: 'TSH out of range indicates thyroid issues affecting metabolism and energy.',
    category: 'Hormones',
    actionItems: [
      'Get full thyroid panel (T3, T4, antibodies)',
      'Check iodine and selenium intake',
      'Manage stress levels',
      'Consider thyroid medication if needed',
      'Monitor symptoms: fatigue, weight, temperature',
    ],
    priorityIfOutOfRange: 'high',
    priorityIfBorderline: 'medium',
  },
];

function categorizeStatus(status: BiomarkerStatus): 'optimal' | 'normal' | 'borderline' | 'outOfRange' {
  if (status === 'optimal') return 'optimal';
  if (status === 'normal') return 'normal';
  if (status === 'borderline') return 'borderline';
  return 'outOfRange';
}

export function generateGoals(
  biomarkers: ExtractedBiomarkers,
  phenoAge: PhenoAgeResult | null,
  bodyComp?: BodyComposition
): Goal[] {
  const goals: Goal[] = [];

  // Check each biomarker against templates
  for (const template of GOAL_TEMPLATES) {
    const rawValue = biomarkers[template.biomarkerKey as keyof ExtractedBiomarkers];
    if (rawValue === undefined || typeof rawValue !== 'number') continue;
    const value = rawValue;

    const status = getBiomarkerStatus(template.biomarkerKey, value);
    const category = categorizeStatus(status);

    if (category === 'optimal' || category === 'normal') continue;

    const ref = BIOMARKER_REFERENCES[template.biomarkerKey];
    const targetRange = ref?.optimal
      ? `${ref.optimal.min ?? ''}${ref.optimal.min && ref.optimal.max ? '-' : ''}${ref.optimal.max ?? ''} ${ref.unit}`
      : undefined;

    goals.push({
      id: `goal-${template.biomarkerKey}`,
      title: template.title,
      description: template.description,
      priority: category === 'outOfRange' ? template.priorityIfOutOfRange : template.priorityIfBorderline,
      category: template.category,
      actionItems: template.actionItems,
      biomarkerKey: template.biomarkerKey,
      currentValue: value,
      targetValue: targetRange,
    });
  }

  // Add biological age goal if significantly older
  if (phenoAge && phenoAge.delta > 2) {
    goals.push({
      id: 'goal-bioage',
      title: 'Reverse biological aging',
      description: `Your biological age is ${phenoAge.delta.toFixed(1)} years older than your chronological age. Focus on the key biomarkers that drive PhenoAge.`,
      priority: phenoAge.delta > 5 ? 'high' : 'medium',
      category: 'Longevity',
      actionItems: [
        'Focus on reducing inflammation (CRP)',
        'Optimize metabolic markers (glucose, HbA1c)',
        'Improve kidney function (creatinine)',
        'Boost immune markers (lymphocytes, WBC)',
        'Consider rapamycin protocol (consult longevity physician)',
      ],
    });
  }

  // Add body composition goal if body fat is high
  if (bodyComp?.bodyFatPercent && bodyComp.bodyFatPercent > 25) {
    goals.push({
      id: 'goal-bodyfat',
      title: 'Optimize body composition',
      description: `Current body fat is ${bodyComp.bodyFatPercent}%. Reducing to 15-20% improves metabolic health significantly.`,
      priority: bodyComp.bodyFatPercent > 30 ? 'high' : 'medium',
      category: 'Body Composition',
      actionItems: [
        'Create modest caloric deficit (300-500 cal/day)',
        'Strength train 3x/week to preserve muscle',
        'High protein intake (1g/lb lean body mass)',
        'Walk 8,000-10,000 steps daily',
        'Track progress with DEXA scans quarterly',
      ],
    });
  }

  // Sort by priority and limit to 7 goals
  const priorityOrder: Record<GoalPriority, number> = { high: 0, medium: 1, low: 2 };
  goals.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return goals.slice(0, 7);
}
