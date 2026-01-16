import type { ExtractedBiomarkers } from '@/lib/extractors/biomarkers';
import { getBiomarkerStatus, BIOMARKER_REFERENCES, type BiomarkerStatus } from '@/lib/types/health';

export interface ContextualPill {
  id: string;
  label: string;
}

interface BiomarkerWithStatus {
  key: string;
  displayName: string;
  value: number;
  unit: string;
  status: BiomarkerStatus;
}

// Priority markers for longevity - these get prioritized when out of range
const PRIORITY_MARKERS = ['apob', 'hba1c', 'crp', 'vitaminD', 'ldl', 'hdl', 'triglycerides', 'fastingInsulin', 'homocysteine'];

// Fixed markers that always get priority if out of range
const FIXED_PRIORITY = ['apob', 'hba1c'];

// Questions to show when all markers are optimal
const OPTIMAL_QUESTIONS: ContextualPill[] = [
  { id: 'optimal-1', label: "What's keeping me healthy?" },
  { id: 'optimal-2', label: 'What should I test next?' },
  { id: 'optimal-3', label: 'How can I optimize more?' },
];

/**
 * Generate contextual question pills based on biomarker data
 *
 * Logic:
 * 1. If any markers out of range, generate questions about them
 * 2. Prioritize ApoB and HbA1c if they're out of range
 * 3. If all optimal, show generic optimization questions
 * 4. Keep questions concise (<30 chars ideally)
 */
export function generateContextualPills(biomarkers: ExtractedBiomarkers): ContextualPill[] {
  // Build list of markers with their status
  const markersWithStatus: BiomarkerWithStatus[] = [];

  for (const [key, value] of Object.entries(biomarkers)) {
    if (key === 'all' || key === 'patientAge' || typeof value !== 'number') continue;

    const ref = BIOMARKER_REFERENCES[key];
    if (!ref) continue;

    const status = getBiomarkerStatus(key, value);
    markersWithStatus.push({
      key,
      displayName: ref.displayName,
      value,
      unit: ref.unit,
      status,
    });
  }

  // Find markers that need attention (out of range or borderline)
  const problemMarkers = markersWithStatus.filter(
    (m) => m.status === 'out_of_range' || m.status === 'borderline'
  );

  // If no problem markers, return optimal questions
  if (problemMarkers.length === 0) {
    return OPTIMAL_QUESTIONS.slice(0, 3);
  }

  // Sort problem markers by priority
  const sortedProblems = problemMarkers.sort((a, b) => {
    // Fixed priority markers come first
    const aFixed = FIXED_PRIORITY.includes(a.key.toLowerCase());
    const bFixed = FIXED_PRIORITY.includes(b.key.toLowerCase());
    if (aFixed && !bFixed) return -1;
    if (!aFixed && bFixed) return 1;

    // Then priority markers
    const aPriority = PRIORITY_MARKERS.includes(a.key.toLowerCase());
    const bPriority = PRIORITY_MARKERS.includes(b.key.toLowerCase());
    if (aPriority && !bPriority) return -1;
    if (!aPriority && bPriority) return 1;

    // Then by status severity
    if (a.status === 'out_of_range' && b.status !== 'out_of_range') return -1;
    if (a.status !== 'out_of_range' && b.status === 'out_of_range') return 1;

    return 0;
  });

  // Generate questions for top 2-3 problem markers
  const pills: ContextualPill[] = [];

  for (const marker of sortedProblems.slice(0, 3)) {
    const question = generateQuestionForMarker(marker);
    pills.push({
      id: `marker-${marker.key}`,
      label: question,
    });
  }

  return pills;
}

/**
 * Generate a concise question for a specific marker
 * Keeps questions under 30 characters when possible
 */
function generateQuestionForMarker(marker: BiomarkerWithStatus): string {
  const { displayName, value, status } = marker;

  // Short name mappings for common markers
  const shortNames: Record<string, string> = {
    'Vitamin D': 'Vit D',
    'Triglycerides': 'Trigs',
    'Total Cholesterol': 'Cholesterol',
    'Fasting Insulin': 'Insulin',
    'Alkaline Phosphatase': 'Alk Phos',
    'Lymphocyte %': 'Lymphocytes',
  };

  const name = shortNames[displayName] || displayName;

  // For out of range, ask why it's high/low
  if (status === 'out_of_range') {
    // Determine if high or low based on reference
    const ref = BIOMARKER_REFERENCES[marker.key];
    if (ref?.optimal?.max !== undefined && value > ref.optimal.max) {
      return `Why is my ${name} high?`;
    }
    if (ref?.optimal?.min !== undefined && value < ref.optimal.min) {
      return `Why is my ${name} low?`;
    }
    return `About my ${name}`;
  }

  // For borderline, ask how to improve
  if (status === 'borderline') {
    return `How to improve ${name}?`;
  }

  return `About my ${name}`;
}

export default generateContextualPills;
