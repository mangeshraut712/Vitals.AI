import Anthropic from '@anthropic-ai/sdk';
import { BodyComposition } from './body-comp';

/**
 * Extended body composition data extracted from DEXA scans
 * Supports any DEXA format (BodySpec, DexaFit, hospital scans, etc.)
 */
export interface ExtendedBodyComposition extends BodyComposition {
  // Basic measurements
  totalMass?: number; // Total body weight in lbs
  height?: number; // Height in inches

  // Regional fat distribution
  armsFatPercent?: number;
  legsFatPercent?: number;
  trunkFatPercent?: number;
  androidFatPercent?: number; // Abdominal region
  gynoidFatPercent?: number; // Hip/thigh region
  agRatio?: number; // Android/Gynoid ratio

  // Regional lean mass
  armsLeanMass?: number;
  legsLeanMass?: number;
  trunkLeanMass?: number;

  // Regional fat mass (lbs)
  armsFatMass?: number;
  legsFatMass?: number;
  trunkFatMass?: number;
  androidFatMass?: number;
  gynoidFatMass?: number;

  // Visceral fat (VAT)
  vatMass?: number; // lbs
  vatVolume?: number; // cubic inches

  // Bone density
  totalBmd?: number; // g/cm²
  spineBmd?: number;
  hipBmd?: number;
  boneDensityZScore?: number; // Age-matched

  // Metabolic
  restingMetabolicRate?: number; // RMR in cal/day

  // Muscle balance (left vs right)
  rightArmLean?: number;
  leftArmLean?: number;
  rightLegLean?: number;
  leftLegLean?: number;

  // Patient info
  sex?: 'male' | 'female';
  scanDate?: string; // ISO date string
}

const EXTRACTION_TOOL: Anthropic.Tool = {
  name: 'extract_body_composition',
  description: 'Extract body composition data from a DEXA scan report',
  input_schema: {
    type: 'object',
    properties: {
      // Patient info
      sex: {
        type: 'string',
        enum: ['male', 'female'],
        description: 'Patient sex',
      },
      scanDate: {
        type: 'string',
        description: 'Date of scan in ISO format (YYYY-MM-DD)',
      },
      patientAge: {
        type: 'number',
        description: 'Patient age at time of scan',
      },
      height: {
        type: 'number',
        description: 'Height in inches',
      },

      // Total body composition
      totalMass: {
        type: 'number',
        description: 'Total body mass/weight in lbs',
      },
      bodyFatPercent: {
        type: 'number',
        description: 'Total body fat percentage',
      },
      fatMass: {
        type: 'number',
        description: 'Total fat tissue mass in lbs',
      },
      leanMass: {
        type: 'number',
        description: 'Total lean tissue mass in lbs',
      },
      boneMineralContent: {
        type: 'number',
        description: 'Total bone mineral content (BMC) in lbs',
      },

      // Regional fat percentages
      armsFatPercent: {
        type: 'number',
        description: 'Arms region fat percentage',
      },
      legsFatPercent: {
        type: 'number',
        description: 'Legs region fat percentage',
      },
      trunkFatPercent: {
        type: 'number',
        description: 'Trunk/torso region fat percentage',
      },
      androidFatPercent: {
        type: 'number',
        description: 'Android (abdominal) region fat percentage',
      },
      gynoidFatPercent: {
        type: 'number',
        description: 'Gynoid (hip/thigh) region fat percentage',
      },
      agRatio: {
        type: 'number',
        description: 'Android/Gynoid (A/G) ratio',
      },

      // Regional fat mass (lbs)
      armsFatMass: {
        type: 'number',
        description: 'Arms fat mass in lbs',
      },
      legsFatMass: {
        type: 'number',
        description: 'Legs fat mass in lbs',
      },
      trunkFatMass: {
        type: 'number',
        description: 'Trunk fat mass in lbs',
      },
      androidFatMass: {
        type: 'number',
        description: 'Android region fat mass in lbs',
      },
      gynoidFatMass: {
        type: 'number',
        description: 'Gynoid region fat mass in lbs',
      },

      // Regional lean mass (lbs)
      armsLeanMass: {
        type: 'number',
        description: 'Arms lean tissue mass in lbs',
      },
      legsLeanMass: {
        type: 'number',
        description: 'Legs lean tissue mass in lbs',
      },
      trunkLeanMass: {
        type: 'number',
        description: 'Trunk lean tissue mass in lbs',
      },

      // Visceral fat
      vatMass: {
        type: 'number',
        description: 'Visceral adipose tissue (VAT) mass in lbs',
      },
      vatVolume: {
        type: 'number',
        description: 'Visceral adipose tissue volume in cubic inches',
      },

      // Bone density
      totalBmd: {
        type: 'number',
        description: 'Total body bone mineral density (BMD) in g/cm²',
      },
      spineBmd: {
        type: 'number',
        description: 'Spine bone mineral density in g/cm²',
      },
      boneDensityTScore: {
        type: 'number',
        description: 'Total body T-Score for bone density',
      },
      boneDensityZScore: {
        type: 'number',
        description: 'Total body Z-Score (age-matched) for bone density',
      },

      // Metabolic
      restingMetabolicRate: {
        type: 'number',
        description: 'Resting metabolic rate (RMR) in calories/day',
      },

      // Muscle balance
      rightArmLean: {
        type: 'number',
        description: 'Right arm lean mass in lbs',
      },
      leftArmLean: {
        type: 'number',
        description: 'Left arm lean mass in lbs',
      },
      rightLegLean: {
        type: 'number',
        description: 'Right leg lean mass in lbs',
      },
      leftLegLean: {
        type: 'number',
        description: 'Left leg lean mass in lbs',
      },
    },
    required: ['bodyFatPercent'],
  },
};

const SYSTEM_PROMPT = `You are a DEXA scan data extraction assistant. Extract body composition values from DEXA scan reports.

IMPORTANT RULES:
- Extract ALL values that are present in the report
- Use the exact numeric values shown (don't convert units)
- DEXA reports may come from different providers (BodySpec, DexaFit, hospitals, etc.) - adapt to the format
- For percentages, extract just the number (e.g., 31.3 not "31.3%")
- For regional data, look for tables with Arms, Legs, Trunk, Android, Gynoid sections
- VAT (Visceral Adipose Tissue) is often in a separate section
- Bone density may have T-Score and Z-Score values
- If a value is not found, do not include it in the output

Common terms to look for:
- Total Body Fat % / Body Fat Percentage
- Lean Tissue / Lean Mass / Fat-Free Mass
- Fat Tissue / Fat Mass
- BMC / Bone Mineral Content
- Android = abdominal/belly region
- Gynoid = hip/thigh region
- A/G Ratio = Android/Gynoid ratio (should be < 1.0)
- VAT = Visceral Adipose Tissue (dangerous belly fat)
- RMR = Resting Metabolic Rate
- BMD = Bone Mineral Density`;

export async function extractBodyCompWithAI(
  text: string
): Promise<ExtendedBodyComposition> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('[Vitals.AI] No API key, skipping AI body comp extraction');
    return {};
  }

  try {
    const client = new Anthropic({ apiKey });

    console.log('[Vitals.AI] Extracting body composition with AI...');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: [EXTRACTION_TOOL],
      tool_choice: { type: 'tool', name: 'extract_body_composition' },
      messages: [
        {
          role: 'user',
          content: `Extract all body composition data from this DEXA scan report:\n\n${text}`,
        },
      ],
    });

    // Get tool use result
    const toolUse = response.content.find((block) => block.type === 'tool_use');
    if (toolUse && toolUse.type === 'tool_use') {
      const extracted = toolUse.input as ExtendedBodyComposition;

      // Count how many fields were extracted
      // Map vatMass to visceralFat for backwards compatibility
      if (extracted.vatMass !== undefined && extracted.visceralFat === undefined) {
        extracted.visceralFat = extracted.vatMass;
      }

      const fieldCount = Object.keys(extracted).filter(
        (k) => extracted[k as keyof ExtendedBodyComposition] !== undefined
      ).length;

      console.log(`[Vitals.AI] AI extracted ${fieldCount} body composition fields`);

      // Log key metrics for debugging
      if (extracted.bodyFatPercent) {
        console.log(`[Vitals.AI] Body Fat: ${extracted.bodyFatPercent}%`);
      }
      if (extracted.leanMass) {
        console.log(`[Vitals.AI] Lean Mass: ${extracted.leanMass} lbs`);
      }
      if (extracted.vatMass) {
        console.log(`[Vitals.AI] VAT: ${extracted.vatMass} lbs`);
      }

      return extracted;
    }

    console.warn('[Vitals.AI] No tool use in body comp response');
    return {};
  } catch (error) {
    console.error('[Vitals.AI] AI body comp extraction error:', error);
    return {};
  }
}
