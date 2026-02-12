import Anthropic from '@anthropic-ai/sdk';

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

export async function queryHealthAgent(
  message: string,
  healthContext: string
): Promise<HealthAgentResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      content: "I'm ready to help! Please set your `ANTHROPIC_API_KEY` in the `.env.local` file to connect me to the intelligence engine.",
    };
  }

  const anthropic = new Anthropic({
    apiKey: apiKey,
  });

  const fullPrompt = `## User's Health Data Context
${healthContext}

## User Question
${message}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 1024,
      system: HEALTH_SYSTEM_PROMPT,
      messages: [
        { role: "user", content: fullPrompt }
      ],
    });

    const content = response.content.map(block => block.type === 'text' ? block.text : '').join('');
    const { content: sanitizedContent, removedCount } = sanitizeUnverifiedSourceUrls(content);

    const finalContent = removedCount > 0
      ? `${sanitizedContent}\n\n*Note: unverified links were removed.*`
      : sanitizedContent;

    return { content: finalContent };

  } catch (error) {
    console.error('[Vitals.AI] Anthropic API Error:', error);
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
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      content: "I'm ready to help! Please set your `ANTHROPIC_API_KEY` in the `.env.local` file to connect me to the intelligence engine.",
    };
  }

  const anthropic = new Anthropic({
    apiKey: apiKey,
  });

  const fullPrompt = `## User's Health Data Context
${healthContext}

## User Question
${message}`;

  try {
    let fullContent = '';
    const stream = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 1024,
      system: HEALTH_SYSTEM_PROMPT,
      messages: [
        { role: "user", content: fullPrompt }
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        const delta = chunk.delta;
        const text =
          delta && typeof delta === 'object' && 'text' in delta && typeof delta.text === 'string'
            ? delta.text
            : '';
        if (text) {
          fullContent += text;
          onChunk(text);
        }
      }
    }

    const { content: sanitizedContent, removedCount } = sanitizeUnverifiedSourceUrls(fullContent);

    const finalContent = removedCount > 0
      ? `${sanitizedContent}\n\n*Note: unverified links were removed.*`
      : sanitizedContent;

    return { content: finalContent };

  } catch (error) {
    console.error('[Vitals.AI] Anthropic API Streaming Error:', error);
    return {
      content: "I'm having trouble connecting to my knowledge base right now.",
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export function createHealthAgent(): typeof queryHealthAgent {
  return queryHealthAgent;
}
