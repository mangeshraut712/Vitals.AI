import { createOpenAI } from '@ai-sdk/openai';
import { streamText, generateText } from 'ai';

const VERIFIED_SOURCE_DOMAINS = [
  'pubmed.ncbi.nlm.nih.gov',
  'nih.gov',
  'blueprint.bryanjohnson.com',
  'peterattiamd.com',
  'examine.com',
  'doi.org',
];

const HEALTH_SYSTEM_PROMPT = `You are Vitals.AI, a knowledgeable health assistant that helps users understand their health data and make informed decisions about their wellness.

## Your Role
- Analyze health biomarkers and provide context
- Explain what values mean and their significance
- Suggest evidence-based lifestyle improvements
- Help users understand their PhenoAge (biological age) results

## Reference Ranges (Optimal for Longevity)

### Levine PhenoAge Biomarkers
- Albumin: 4.5-5.0 g/dL (higher generally better)
- Creatinine: 0.7-1.0 mg/dL (lower renal stress)
- Glucose (fasting): 70-85 mg/dL (optimal metabolic health)
- CRP: <0.5 mg/L (minimal inflammation)
- Lymphocyte %: 25-35% (balanced immune function)
- MCV: 82-92 fL (optimal RBC size)
- RDW: 11.5-13.0% (low variation is better)
- Alkaline Phosphatase: 40-70 U/L
- WBC: 4.0-6.0 10³/µL

### Lipid Panel
- LDL-C: <70 mg/dL (or ApoB < 60 mg/dL)
- HDL-C: >60 mg/dL
- Triglycerides: <100 mg/dL (ideally < 70 mg/dL)

### Metabolic Health
- HbA1c: <5.2%
- Fasting Insulin: 2-5 µIU/mL

### Activity Metrics
- HRV: Higher is better (relative to baseline)
- Resting Heart Rate: <60 bpm is excellent
- Sleep: 7-9 hours, with >1.5h Deep and >1.5h REM

## Verified Knowledge Sources
Prefer information from:
- PubMed / NIH (Research)
- Peter Attia (Longevity Medicine)
- Bryan Johnson (Blueprint)
- Examine.com (Supplements)
- Rhonda Patrick (FoundMyFitness)

## Response Guidelines
1. **Be Precise**: Use the user's provided data values.
2. **Contextualize**: Explain *why* a number matters (e.g., "Elevated CRP indicates systemic inflammation...").
3. **Actionable**: Suggest specific behavioral changes (sleep, diet, exercise) before supplements.
4. **Disclaimer**: You are an AI, not a doctor. Medical advice disclaimer is mandatory for any diagnostic opinion.

The Levine PhenoAge formula is a research tool, not a clinical diagnostic.`;

export interface HealthAgentResponse {
  content: string;
  error?: string;
}

function isVerifiedSourceUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return VERIFIED_SOURCE_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

function sanitizeUnverifiedSourceUrls(content: string): { content: string; removedCount: number } {
  const urlRegex = /https?:\/\/[^\s)\]]+/g;
  let removedCount = 0;

  const sanitized = content.replace(urlRegex, (url) => {
    if (isVerifiedSourceUrl(url)) {
      return url;
    }
    removedCount += 1;
    return '[source-removed]';
  });

  return { content: sanitized, removedCount };
}

// Initialize OpenRouter client via OpenAI SDK
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Configure the model - using Google Gemini 2.0 Flash (Preview) via OpenRouter as default "best free model"
// Fallback to OpenAI or others if needed, but sticking to requested free model.
const MODEL = 'google/gemini-2.0-flash-lite-preview-02-05:free';

export async function queryHealthAgent(
  message: string,
  healthContext: string
): Promise<HealthAgentResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return {
      content: "I'm ready to help! Please set your `OPENROUTER_API_KEY` in the `.env.local` file (or Vercel Dashboard) to connect me to the intelligence engine.",
    };
  }

  const fullPrompt = `## User's Health Data Context
${healthContext}

## User Question
${message}`;

  try {
    const { text } = await generateText({
      model: openrouter(MODEL),
      system: HEALTH_SYSTEM_PROMPT,
      prompt: fullPrompt,
    });

    const { content: sanitizedContent, removedCount } = sanitizeUnverifiedSourceUrls(text);

    const finalContent = removedCount > 0
      ? `${sanitizedContent}\n\n*Note: unverified links were removed.*`
      : sanitizedContent;

    return { content: finalContent };

  } catch (error) {
    console.error('[Vitals.AI] OpenRouter API Error:', error);
    return {
      content: "I'm having trouble connecting to my knowledge base right now.",
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function queryHealthAgentStream(
  message: string,
  healthContext: string,
  onChunk: (text: string) => void
): Promise<HealthAgentResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  // Fallback check for Anthropic key if OpenRouter missing (backward compatibility)
  if (!apiKey && !process.env.ANTHROPIC_API_KEY) {
    const msg = "I'm ready to help! Please set your `OPENROUTER_API_KEY` in the `.env.local` file to connect me to the intelligence engine.";
    onChunk(msg);
    return { content: msg };
  }

  // Use OpenRouter provider
  const provider = openrouter;
  const modelId = MODEL;

  const fullPrompt = `## User's Health Data Context
${healthContext}

## User Question
${message}`;

  try {
    let fullContent = '';

    const result = await streamText({
      model: provider(modelId),
      system: HEALTH_SYSTEM_PROMPT,
      prompt: fullPrompt,
    });

    for await (const textPart of result.textStream) {
      if (textPart) {
        fullContent += textPart;
        onChunk(textPart);
      }
    }

    const { content: sanitizedContent, removedCount } = sanitizeUnverifiedSourceUrls(fullContent);

    const finalContent = removedCount > 0
      ? `${sanitizedContent}\n\n*Note: unverified links were removed.*`
      : sanitizedContent;

    return { content: finalContent };

  } catch (error) {
    console.error('[Vitals.AI] OpenRouter API Streaming Error:', error);
    return {
      content: "I'm having trouble connecting to my knowledge base right now.",
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export function createHealthAgent(): typeof queryHealthAgent {
  return queryHealthAgent;
}
