import { createOpenAI } from '@ai-sdk/openai';
import { generateText, isStepCount, streamText } from 'ai';
import { getOpenRouterHeaders } from '@/lib/runtime/deployment';
import { createHealthAiTools } from '@/lib/agent/ai-tools';
import { runDeterministicAgentTurn } from '@/lib/agent/deterministic-runtime';
import { isHealthToolName } from '@/lib/agent/tool-names';
import { EMPTY_HEALTH_SNAPSHOT } from '@/lib/agent/demo-snapshot';
import type { HealthSnapshot } from '@/lib/agent/health-snapshot';
import { isTracingEnabled, withSpan } from '@/lib/observability/tracing';
import type { AgentStreamEvent } from '@/lib/agent/agent-events';

const VERIFIED_SOURCE_DOMAINS = [
  'pubmed.ncbi.nlm.nih.gov',
  'nih.gov',
  'blueprint.bryanjohnson.com',
  'peterattiamd.com',
  'examine.com',
  'doi.org',
];

const DEFAULT_OPENROUTER_MODEL = 'openrouter/free';

const HEALTH_SYSTEM_PROMPT = `You are Vitals.AI, a knowledgeable health assistant that helps users understand their health data and make informed decisions about their wellness.

## Your Role
- Call tools before answering questions about labs, recovery, or biological age
- Analyze health biomarkers and provide context
- Explain what values mean and their significance
- Suggest evidence-based lifestyle improvements
- Help users understand their PhenoAge (biological age) results

## Tools
- lookupBiomarker: lab markers (CRP, LDL, glucose, summary)
- getRecoverySnapshot: sleep, HRV, recovery, steps
- getHealthScorecard: composite score + PhenoAge

If a tool returns empty: true, say so clearly and do not invent numbers.

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

## Response Guidelines
1. **Be Precise**: Use tool results and the provided health context.
2. **Contextualize**: Explain why a number matters.
3. **Actionable**: Suggest sleep, diet, and exercise before supplements.
4. **Disclaimer**: You are an AI, not a doctor.

The Levine PhenoAge formula is a research tool, not a clinical diagnostic.`;

export interface HealthAgentResponse {
  content: string;
  error?: string;
}

function parseModelList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);
}

function getModelCandidates(): string[] {
  const preferred = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL;
  const fallbackFromEnv = parseModelList(process.env.OPENROUTER_FALLBACK_MODELS);

  return Array.from(new Set([preferred, ...fallbackFromEnv]));
}

function getMissingKeyMessage(): string {
  return 'Set OPENROUTER_API_KEY in `.env.local` to enable live model streaming. Tools still run on local files.';
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

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: getOpenRouterHeaders(),
});

function telemetryOptions() {
  return {
    isEnabled: isTracingEnabled(),
    functionId: 'health-agent',
  };
}

export async function queryHealthAgent(
  message: string,
  healthContext: string,
  snapshot: HealthSnapshot = EMPTY_HEALTH_SNAPSHOT
): Promise<HealthAgentResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const tools = createHealthAiTools(snapshot);

  if (!apiKey) {
    let content = '';
    await runDeterministicAgentTurn({
      message,
      snapshot,
      mode: 'offline',
      onEvent: (event) => {
        if (event.type === 'text') content = event.text;
      },
    });
    return { content: content || getMissingKeyMessage() };
  }

  const fullPrompt = `## User's Health Data Context
${healthContext}

## User Question
${message}`;

  const modelCandidates = getModelCandidates();
  let lastError: unknown;

  for (const modelId of modelCandidates) {
    try {
      const { text } = await generateText({
        model: openrouter(modelId),
        system: HEALTH_SYSTEM_PROMPT,
        prompt: fullPrompt,
        tools,
        stopWhen: isStepCount(5),
        experimental_telemetry: telemetryOptions(),
      });

      const { content: sanitizedContent, removedCount } = sanitizeUnverifiedSourceUrls(text);

      const finalContent = removedCount > 0
        ? `${sanitizedContent}\n\n*Note: unverified links were removed.*`
        : sanitizedContent;

      return { content: finalContent };
    } catch (error) {
      lastError = error;
      console.warn(`[Vitals.AI] OpenRouter model failed (${modelId}), trying next fallback.`);
    }
  }

  console.error('[Vitals.AI] OpenRouter API Error:', lastError);
  return {
    content: "I'm having trouble connecting to my knowledge base right now.",
    error: lastError instanceof Error ? lastError.message : 'Unknown error',
  };
}

function formatStreamResult(content: string): HealthAgentResponse {
  const { content: sanitizedContent, removedCount } = sanitizeUnverifiedSourceUrls(content);
  const finalContent = removedCount > 0
    ? `${sanitizedContent}\n\n*Note: unverified links were removed.*`
    : sanitizedContent;

  return { content: finalContent };
}

function emitStreamPart(
  part: { type: string; text?: string; delta?: string; toolName?: string; input?: unknown; output?: unknown },
  onEvent: (event: AgentStreamEvent) => void
): void {
  switch (part.type) {
    case 'text-delta': {
      const text = part.text ?? part.delta ?? '';
      if (text) onEvent({ type: 'text', text });
      return;
    }
    case 'tool-call': {
      if (part.toolName && isHealthToolName(part.toolName)) {
        onEvent({ type: 'tool', name: part.toolName, status: 'start', input: part.input });
      }
      return;
    }
    case 'tool-result': {
      if (part.toolName && isHealthToolName(part.toolName)) {
        onEvent({ type: 'tool', name: part.toolName, status: 'result', result: part.output });
      }
      return;
    }
    default:
      return;
  }
}

async function streamWithFallback(
  prompt: string,
  snapshot: HealthSnapshot,
  onEvent: (event: AgentStreamEvent) => void
): Promise<HealthAgentResponse> {
  const modelCandidates = getModelCandidates();
  const tools = createHealthAiTools(snapshot);
  let lastError: unknown;

  for (const modelId of modelCandidates) {
    let candidateContent = '';
    try {
      const result = await streamText({
        model: openrouter(modelId),
        system: HEALTH_SYSTEM_PROMPT,
        prompt,
        tools,
        stopWhen: isStepCount(5),
        experimental_telemetry: telemetryOptions(),
      });

      const parts = result.fullStream ?? result.stream;
      for await (const part of parts) {
        emitStreamPart(part as { type: string; text?: string; delta?: string; toolName?: string; input?: unknown; output?: unknown }, onEvent);
        if (part.type === 'text-delta') {
          const text = 'text' in part && typeof part.text === 'string' ? part.text : '';
          candidateContent += text;
        }
      }

      return formatStreamResult(candidateContent);
    } catch (error) {
      lastError = error;

      if (candidateContent.length > 0) {
        throw error;
      }

      console.warn(`[Vitals.AI] OpenRouter stream model failed (${modelId}), trying next fallback.`);
    }
  }

  throw lastError ?? new Error('No OpenRouter model candidates available');
}

export async function queryHealthAgentStream(
  message: string,
  healthContext: string,
  onEvent: (event: AgentStreamEvent) => void,
  snapshot: HealthSnapshot = EMPTY_HEALTH_SNAPSHOT
): Promise<HealthAgentResponse> {
  return withSpan(
    'agent.queryHealthAgentStream',
    { 'agent.message_length': message.length },
    async () => {
      const apiKey = process.env.OPENROUTER_API_KEY;

      if (!apiKey) {
        return runDeterministicAgentTurn({
          message,
          snapshot,
          mode: 'offline',
          onEvent,
        }).then((result) => ({ content: result.content }));
      }

      const fullPrompt = `## User's Health Data Context
${healthContext}

## User Question
${message}`;

      try {
        onEvent({ type: 'mode', mode: 'live' });
        return await streamWithFallback(fullPrompt, snapshot, onEvent);
      } catch (error) {
        console.error('[Vitals.AI] OpenRouter API Streaming Error:', error);
        onEvent({
          type: 'error',
          message: "I'm having trouble connecting to my knowledge base right now.",
        });
        return {
          content: "I'm having trouble connecting to my knowledge base right now.",
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );
}

export function createHealthAgent(): typeof queryHealthAgent {
  return queryHealthAgent;
}
