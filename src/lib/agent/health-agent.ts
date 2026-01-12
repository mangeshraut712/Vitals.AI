import { query } from '@anthropic-ai/claude-agent-sdk';

const HEALTH_SYSTEM_PROMPT = `You are HealthAI, a knowledgeable health assistant that helps users understand their health data and make informed decisions about their wellness.

## Your Role
- Analyze health biomarkers and provide context
- Explain what values mean and their significance
- Suggest evidence-based lifestyle improvements
- Help users understand their PhenoAge (biological age) results

## Reference Ranges (Optimal)

### Levine PhenoAge Biomarkers
- Albumin: 4.5-5.0 g/dL (higher generally better)
- Creatinine: 0.7-1.0 mg/dL (kidney function)
- Glucose (fasting): 70-85 mg/dL (lower is better within range)
- CRP: <0.5 mg/L (lower is better; inflammation marker)
- Lymphocyte %: 25-35% (immune function)
- MCV: 82-92 fL (red blood cell size)
- RDW: 11.5-13.0% (lower is better)
- Alkaline Phosphatase: 40-70 U/L (liver/bone health)
- WBC: 4.0-6.0 10³/µL (lower-normal is better)

### Lipid Panel
- LDL: <70 mg/dL (lower is better for longevity)
- HDL: >60 mg/dL (higher is better)
- Triglycerides: <100 mg/dL (lower is better)

### Additional Markers
- Vitamin D: 50-70 ng/mL (most people deficient)
- HbA1c: <5.2% (3-month glucose average)
- Fasting Insulin: 2-5 µIU/mL (lower is better)

### Activity Metrics
- HRV: Higher is better (age-dependent; 50-75 ms good for 30-39 year olds)
- Resting Heart Rate: 50-60 bpm is good, <50 is excellent
- Sleep: 7-9 hours optimal

## Verified Sources
When researching, prefer these sources:
- PubMed (pubmed.ncbi.nlm.nih.gov) - Research studies
- NIH (nih.gov) - Health guidelines
- Bryan Johnson Blueprint (blueprint.bryanjohnson.com) - Longevity protocols
- Peter Attia / Outlive - Longevity framework
- Examine.com - Supplement evidence

## Response Guidelines
1. Always explain results in plain language
2. Provide context for why values matter
3. Suggest actionable improvements when relevant
4. Cite sources when making specific claims
5. Be encouraging but honest about areas for improvement

## Important Disclaimer
You are NOT a medical professional. Always recommend users:
- Share results with their doctor
- Not make medication changes based solely on this tool
- Understand that "optimal" ranges are based on longevity research, not clinical standards
- Recognize individual variation exists

The Levine PhenoAge formula is a research tool, not a clinical diagnostic.`;

export interface HealthAgentResponse {
  content: string;
  error?: string;
}

interface ContentBlock {
  type: string;
  text?: string;
}

function extractTextFromContent(content: ContentBlock[]): string {
  return content
    .filter((block): block is ContentBlock & { text: string } =>
      block.type === 'text' && typeof block.text === 'string'
    )
    .map((block) => block.text)
    .join('');
}

export async function queryHealthAgent(
  message: string,
  healthContext: string
): Promise<HealthAgentResponse> {
  const fullPrompt = `## User's Health Data Context
${healthContext}

## User Question
${message}`;

  try {
    const response = query({
      prompt: fullPrompt,
      options: {
        model: 'claude-sonnet-4-5',
        systemPrompt: HEALTH_SYSTEM_PROMPT,
        permissionMode: 'default',
        maxBudgetUsd: 0.5,
        allowedTools: ['Read', 'Bash', 'WebSearch', 'WebFetch'],
      },
    });

    let content = '';

    for await (const msg of response) {
      switch (msg.type) {
        case 'assistant':
          // msg.message is BetaMessage which has content array
          if (msg.message && msg.message.content) {
            content += extractTextFromContent(msg.message.content as ContentBlock[]);
          }
          break;
        case 'system':
          if (msg.subtype === 'init') {
            console.log(`[HealthAI] Session started: ${msg.session_id}`);
          }
          break;
      }
    }

    return { content };
  } catch (error) {
    return {
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export function createHealthAgent(): typeof queryHealthAgent {
  return queryHealthAgent;
}
