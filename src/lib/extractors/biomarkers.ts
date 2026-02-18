// Dynamic biomarker from any lab test
export interface DynamicBiomarker {
  name: string; // Display name (e.g., "Albumin")
  value: number; // The numeric value
  unit: string; // e.g., "g/dL", "mg/dL"
  referenceRange?: string; // e.g., "3.5-5.0"
  status?: 'normal' | 'high' | 'low'; // H/L flag from lab
  category?: string; // e.g., "Metabolic Panel", "CBC"
}

export interface ExtractedBiomarkers {
  // Levine PhenoAge biomarkers (kept for calculations)
  albumin?: number;
  creatinine?: number;
  glucose?: number;
  crp?: number;
  lymphocytePercent?: number;
  mcv?: number;
  rdw?: number;
  alkalinePhosphatase?: number;
  wbc?: number;

  // Lipid panel
  ldl?: number;
  hdl?: number;
  triglycerides?: number;
  totalCholesterol?: number;

  // Additional markers
  vitaminD?: number;
  hba1c?: number;
  fastingInsulin?: number;
  homocysteine?: number;
  ferritin?: number;

  // Thyroid
  tsh?: number;
  freeT4?: number;
  freeT3?: number;

  // Metadata
  patientAge?: number;

  // All biomarkers (dynamic - extracted from any lab)
  all?: DynamicBiomarker[];

  // Allow any additional biomarker keys from comprehensive reference
  [key: string]: number | DynamicBiomarker[] | undefined;
}

// Numeric biomarker keys (excluding 'all' for regex extraction)
type NumericBiomarkerKey = Exclude<keyof ExtractedBiomarkers, 'all'>;

interface BiomarkerPattern {
  key: NumericBiomarkerKey;
  patterns: RegExp[];
}

const BIOMARKER_PATTERNS: BiomarkerPattern[] = [
  // Levine PhenoAge biomarkers
  {
    key: 'albumin',
    patterns: [
      // Thyrocare LFT: "ALBUMIN - SERUMPHOTOMETRY3.2-4.8gm/dL 4.34"
      /ALBUMIN\s*-\s*SERUM[^\n]*gm?\/dL\s*([\d.]+)/i,
      /albumin[:\s]+(\d+\.?\d*)/i,
    ],
  },
  {
    key: 'creatinine',
    patterns: [
      // Thyrocare kidney: "CREATININE - SERUMPHOTOMETRY0.72-1.18mg/dL 0.92"
      /CREATININE\s*-\s*SERUM[^\n]*mg\/dL\s*([\d.]+)/i,
      /creatinine[:\s]+(\d+\.?\d*)/i,
    ],
  },
  {
    key: 'glucose',
    patterns: [
      // Thyrocare CLIA format: PHOTOMETRY\nVALUE\nmg/dL\nFASTING BLOOD SUGAR
      /PHOTOMETRY\s*\n([\d.]+)\s*\nmg\/dL\s*\nFASTING BLOOD SUGAR/i,
      /fasting blood sugar[^:]*[:\s]+(\d+\.?\d*)/i, // Thyrocare normalized
      /glucose[,\s]*fasting[:\s]+(\d+\.?\d*)/i,
      /fasting[,\s]*glucose[:\s]+(\d+\.?\d*)/i,
      /glucose[:\s]+(\d+\.?\d*)/i,
    ],
  },
  {
    key: 'crp',
    patterns: [
      /hs\s+crp[:\s]+(\d+\.?\d*)/i, // Quest PDF: HS CRP 1.6
      /c-reactive protein[^:]*[:\s]+(\d+\.?\d*)/i,
      /crp[:\s]+(\d+\.?\d*)/i,
      /hs-crp[:\s]+(\d+\.?\d*)/i,
    ],
  },
  {
    key: 'lymphocytePercent',
    patterns: [
      /lymphocytes\s+(\d+\.?\d*)\s*%/i, // Quest PDF: LYMPHOCYTES 26.1 % (percentage line)
      /lymphocyte percent[:\s]+(\d+\.?\d*)/i,
      /lymphocyte[s]?[:\s]+(\d+\.?\d*)%/i,
      /lymphocyte[s]?[:\s]+(\d+\.?\d*)\s*%/i,
      // Thyrocare DLC format: %\n VALUE\nREF_RANGE\nLymphocytes Percentage
      /%\s*\n\s*([\d.]+)\s*\n20-40\s*\nLymphocytes Percentage/i,
    ],
  },
  {
    key: 'mcv',
    patterns: [
      // Thyrocare CBC format: fL\n VALUE\nREF_RANGE\nMean Corpuscular Volume
      /fL\s*\n\s*([\d.]+)\s*\n[\d.]+\s*-\s*[\d.]+\s*\nMean Corpuscular Volume/i,
      /mean cell volume[^\n:]*[:\s]+(\d+\.?\d*)/i,
      /mean corpuscular volume[^\n:]*[:\s]+(\d+\.?\d*)/i, // Thyrocare normalized
      /mcv[:\s]+(\d+\.?\d*)/i,
    ],
  },
  {
    key: 'rdw',
    patterns: [
      // Thyrocare CBC format: fL\n VALUE\nREF_RANGE\nRed Cell Distribution Width
      /fL\s*\n\s*([\d.]+)\s*\n[\d.]+\s*-\s*[\d.]+\s*\nRed Cell Distribution Width/i,
      /red cell distribution width[^\n:]*[:\s]+(\d+\.?\d*)/i, // Thyrocare normalized
      /rdw[:\s]+(\d+\.?\d*)/i,
    ],
  },
  {
    key: 'alkalinePhosphatase',
    patterns: [
      /alkaline phosphatase[:\s]+(\d+\.?\d*)/i,
      /alk phos[:\s]+(\d+\.?\d*)/i,
      /alp[:\s]+(\d+\.?\d*)/i,
      // Thyrocare LFT: "ALKALINE PHOSPHATASEPHOTOMETRY45-129U/L 114"
      /ALKALINE PHOSPHATASE[^\n]*U\/L\s*([\d.]+)/i,
    ],
  },
  {
    key: 'wbc',
    patterns: [
      // Thyrocare CBC format: X 10³ / μL\n VALUE\nREF_RANGE\nTOTAL LEUCOCYTE COUNT (WBC)
      /X 10³ \/ μL\s*\n\s*([\d.]+)\s*\n[\d.]+\s*-\s*[\d.]+\s*\nTOTAL LEUCOCYTE COUNT/i,
      // Allow caret notation and spacing variants (X 10^3/μL)
      /X 10\^3\s*\/\s*μL\s*\n\s*([\d.]+)\s*\n[\d.]+\s*-\s*[\d.]+\s*\nTOTAL LEUCOCYTE COUNT/i,
      /white blood cell count[^\n:]*[:\s]+(\d+\.?\d*)/i,
      /total leucocyte count[^\n:]*[:\s]+(\d+\.?\d*)/i, // Thyrocare normalized
      /total wbc count[^\n:]*[:\s]+(\d+\.?\d*)/i,
      /wbc[:\s]+(\d+\.?\d*)/i,
    ],
  },

  // Lipid panel
  {
    key: 'ldl',
    patterns: [
      /ldl-?cholesterol[:\s]+(\d+\.?\d*)/i, // Quest PDF: LDL-CHOLESTEROL 156
      /ldl cholesterol[:\s]+(\d+\.?\d*)/i,
      // Thyrocare: "LDL CHOLESTEROL - DIRECTPHOTOMETRY< 100mg/dL 111.6"
      /LDL CHOLESTEROL[^\n]*mg\/dL\s*([\d.]+)/i,
      /ldl[:\s]+(\d+\.?\d*)/i,
    ],
  },
  {
    key: 'hdl',
    patterns: [
      /hdl cholesterol[:\s]+(\d+\.?\d*)/i,
      // Thyrocare: "HDL CHOLESTEROL - DIRECTPHOTOMETRY40-60mg/dL 41"
      /HDL CHOLESTEROL[^\n]*mg\/dL\s*([\d.]+)/i,
      /hdl[:\s]+(\d+\.?\d*)/i,
    ],
  },
  {
    key: 'triglycerides',
    patterns: [
      /triglycerides[:\s]+(\d+\.?\d*)/i,
      // Thyrocare: "TRIGLYCERIDESPHOTOMETRY< 150mg/dL 75"
      /TRIGLYCERIDES[A-Z]*[^\n]*mg\/dL\s*([\d.]+)/i,
    ],
  },
  {
    key: 'totalCholesterol',
    patterns: [
      /cholesterol,?\s*total[:\s]+(\d+\.?\d*)/i, // Quest PDF: CHOLESTEROL, TOTAL 225
      /total cholesterol[:\s]+(\d+\.?\d*)/i,
      /^cholesterol[:\s]+(\d+\.?\d*)/im,
      // Thyrocare lipid panel: all on one line "TOTAL CHOLESTEROLPHOTOMETRY< 200mg/dL 168"
      /TOTAL CHOLESTEROL[A-Z]*[^\n]*mg\/dL\s*([\d.]+)/i,
    ],
  },

  // Additional markers
  {
    key: 'vitaminD',
    patterns: [
      // Thyrocare CLIA format: C.L.I.A\nVALUE\nBio. Ref. Interval. :-\nng/mL25-OH VITAMIN D
      /C\.L\.I\.A\s*\n([\d.]+)\s*\nBio\. Ref\. Interval\. :-\s*\nng\/mL25-OH VITAMIN D/i,
      /vitamin\s*d,25-oh[,\w]*\s+(\d+\.?\d*)/i, // Quest PDF: VITAMIN D,25-OH,TOTAL,IA 15
      /vitamin d[,\s]*25-oh[:\s]+(\d+\.?\d*)/i,
      /25-oh[,\s]*vitamin d[:\s]+(\d+\.?\d*)/i,
      /25-oh vitamin d[^:]*[:\s]+(\d+\.?\d*)/i, // Thyrocare normalized
      /vitamin d[:\s]+(\d+\.?\d*)/i,
    ],
  },
  {
    key: 'hba1c',
    patterns: [
      /hemoglobin\s*a1c[:\s]+(\d+\.?\d*)/i, // Quest PDF: HEMOGLOBIN A1c 5.7
      /hba1c[:\s]+(\d+\.?\d*)/i,
      /hemoglobin a1c[:\s]+(\d+\.?\d*)/i,
    ],
  },
  {
    key: 'fastingInsulin',
    patterns: [
      /fasting insulin[:\s]+(\d+\.?\d*)/i,
      /insulin[,\s]*fasting[:\s]+(\d+\.?\d*)/i,
    ],
  },
  {
    key: 'homocysteine',
    patterns: [/homocysteine[:\s]+(\d+\.?\d*)/i],
  },
  {
    key: 'ferritin',
    patterns: [/ferritin[:\s]+(\d+\.?\d*)/i],
  },

  // Thyroid
  {
    key: 'tsh',
    patterns: [
      /tsh\s*-\s*ultrasensitive[^:]*[:\s]+(\d+\.?\d*)/i, // Thyrocare normalized
      // Thyrocare CMIA format: μIU/mL\nREF_RANGE\nVALUE\nMethod
      /μIU\/mL\s*\n[\d.]+-[\d.]+\s*\n([\d.]+)\s*\nMethod/i,
      /tsh[:\s]+(\d+\.?\d*)/i,
    ],
  },
  {
    key: 'freeT4',
    patterns: [/free t4[:\s]+(\d+\.?\d*)/i, /ft4[:\s]+(\d+\.?\d*)/i],
  },
  {
    key: 'freeT3',
    patterns: [/free t3[:\s]+(\d+\.?\d*)/i, /ft3[:\s]+(\d+\.?\d*)/i],
  },

  // Patient age
  {
    key: 'patientAge',
    patterns: [
      /\((\d+)Y\/[MF]\)/i, // Thyrocare: Mangesh Raut(26Y/M)
      /age[:\s]+(\d+)\s*years/i,
      /age[:\s]+(\d+)/i,
    ],
  },
];

/**
 * Normalize Thyrocare-style PDFs where the format is:
 *   VALUE
 *   UNIT          (pure unit like "mg/dL", or concatenated "mg/dLFASTING BLOOD SUGAR")
 *   TEST_NAME     (sometimes on the unit line, sometimes on the next line)
 * into the standard format:
 *   TEST_NAME: VALUE
 *
 * This allows the existing regex patterns to match.
 */
function normalizeThyrocarePdf(text: string): string {
  const lines = text.split('\n').map((l) => l.trim());
  const normalized: string[] = [];

  // Regex to detect a pure unit line (no test name mixed in)
  const PURE_UNIT = /^(mg\/dL|ng\/mL|pg\/mL|μIU\/mL|μg\/dL|g\/dL|fL|pq|%|U\/L|IU\/L|mmol\/L|nmol\/L|mL\/min[^\n]*)$/i;
  // Regex to detect a unit line that has a test name concatenated after it
  const UNIT_WITH_NAME = /^(mg\/dL|ng\/mL|pg\/mL|μIU\/mL|μg\/dL|g\/dL|fL|pq|U\/L|IU\/L|mmol\/L|nmol\/L|mL\/min)([A-Z].+)$/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line is a numeric value (integer or decimal)
    if (/^\d+\.?\d*$/.test(line)) {
      const value = line;
      const nextLine = lines[i + 1] ?? '';

      // Case 1: unit line has test name concatenated (e.g., "mg/dLFASTING BLOOD SUGAR(GLUCOSE)")
      const unitWithName = nextLine.match(UNIT_WITH_NAME);
      if (unitWithName) {
        const testName = unitWithName[2].trim();
        if (testName.length > 2) {
          normalized.push(`${testName}: ${value}`);
          i += 1; // skip unit+name line
          continue;
        }
      }

      // Case 2: Thyrocare format where "Bio. Ref. Interval. :-" appears between value and unit+name
      // e.g.: VALUE → "Bio. Ref. Interval. :-" → "ng/mL25-OH VITAMIN D (TOTAL)"
      // Scan up to 4 lines ahead to find a unit+name line
      let foundUnitName = false;
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const candidate = lines[j];
        const unitWithNameAhead = candidate.match(UNIT_WITH_NAME);
        if (unitWithNameAhead) {
          const testName = unitWithNameAhead[2].trim();
          if (testName.length > 2) {
            normalized.push(`${testName}: ${value}`);
            i = j; // skip to this line
            foundUnitName = true;
            break;
          }
        }
        // Also check pure unit followed by test name
        if (PURE_UNIT.test(candidate)) {
          // Look for test name in subsequent lines
          for (let k = j + 1; k < Math.min(j + 4, lines.length); k++) {
            const testCandidate = lines[k].trim();
            if (
              testCandidate.length > 2 &&
              !testCandidate.startsWith('Bio.') &&
              !testCandidate.startsWith('Normal') &&
              !testCandidate.startsWith('Page') &&
              !testCandidate.match(/^\d{2}\s+\w+\s+\d{4}/) &&
              !testCandidate.match(/^[<>]/) &&
              !testCandidate.match(/^\d+\s*-\s*\d+/) &&
              testCandidate.match(/[A-Z]/)
            ) {
              normalized.push(`${testCandidate}: ${value}`);
              i = j; // skip to unit line
              foundUnitName = true;
              break;
            }
          }
          if (foundUnitName) break;
        }
        // Stop scanning if we hit another numeric value or a page marker
        if (/^\d+\.?\d*$/.test(candidate) || candidate.startsWith('Page :')) break;
      }

      if (!foundUnitName) {
        normalized.push(line);
      }
    } else {
      normalized.push(line);
    }
  }

  // Also add patient age from header like "Mangesh Raut(26Y/M)"
  const ageMatch = text.match(/\((\d+)Y\/[MF]\)/i);
  if (ageMatch) {
    normalized.push(`Age: ${ageMatch[1]} years`);
  }

  return normalized.join('\n');
}

export function extractBiomarkers(text: string): ExtractedBiomarkers {
  const biomarkers: ExtractedBiomarkers = {};

  // Normalize Thyrocare-style PDFs (inverted format: value → unit → test name)
  const normalizedText = normalizeThyrocarePdf(text);
  const searchText = text + '\n' + normalizedText;

  for (const { key, patterns } of BIOMARKER_PATTERNS) {
    for (const pattern of patterns) {
      const match = searchText.match(pattern);
      if (match && match[1]) {
        const value = parseFloat(match[1]);
        if (!isNaN(value)) {
          biomarkers[key] = value;
          break;
        }
      }
    }
  }

  return biomarkers;
}

export function hasAllPhenoAgeInputs(biomarkers: ExtractedBiomarkers): boolean {
  const required: (keyof ExtractedBiomarkers)[] = [
    'albumin',
    'creatinine',
    'glucose',
    'crp',
    'lymphocytePercent',
    'mcv',
    'rdw',
    'alkalinePhosphatase',
    'wbc',
  ];

  return required.every((key) => biomarkers[key] !== undefined);
}
