import { query } from '@anthropic-ai/claude-agent-sdk';

const GOAL_CREATION_SYSTEM_PROMPT = `You are a Goal Coach for Vitals.AI, helping users create personalized health goals grounded in their actual health data.

## Your Role
- Help users articulate and refine their health goals
- Validate goals against their biomarkers, DEXA, and activity data
- Explain WHY a goal matters based on their specific health context
- Suggest specific, measurable targets
- When ready, propose a structured goal for them to add

## Conversation Approach
1. Listen to what the user wants to achieve
2. Pull relevant data points from their health context
3. Ask clarifying questions if needed (1-2 max)
4. Validate whether the goal makes sense for them
5. When you have enough info, propose a structured goal

## When Proposing a Goal
When you're confident about the goal, output it in this exact format:

===GOAL_PROPOSAL===
{
  "title": "Short, action-oriented title (5-7 words)",
  "description": "2-3 sentences explaining the goal and why it matters for this user",
  "priority": "high" | "medium" | "low",
  "category": "Cardiovascular" | "Metabolic" | "Fitness" | "Sleep" | "Nutrition" | "Longevity" | "Mental Health" | "Other",
  "actionItems": ["Specific action 1", "Specific action 2", "Specific action 3"]
}
===END_PROPOSAL===

Then explain why you structured it this way.

## Priority Guidelines
- **high**: Directly addresses an out-of-range biomarker or significant health risk
- **medium**: Optimization opportunity or addresses borderline values
- **low**: General wellness improvement, nice-to-have

## Response Style
- Be encouraging and supportive
- Use emojis sparingly for data callouts (📊 💪 😴 ❤️)
- Keep responses concise (2-3 short paragraphs max)
- Always ground advice in THEIR data, not generic tips

## Important
- Don't propose a goal until you understand what the user wants
- If their goal doesn't relate to their health data, still help but note it's not data-driven
- Never diagnose or prescribe - suggest they consult their doctor for medical decisions`;

export interface GoalProposal {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  actionItems: string[];
}

export interface GoalAgentResponse {
  content: string;
  proposal?: GoalProposal;
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

function parseGoalProposal(content: string): GoalProposal | undefined {
  const proposalMatch = content.match(/===GOAL_PROPOSAL===\s*([\s\S]*?)\s*===END_PROPOSAL===/);

  if (!proposalMatch) return undefined;

  try {
    const jsonStr = proposalMatch[1].trim();
    const proposal = JSON.parse(jsonStr) as GoalProposal;

    // Validate required fields
    if (!proposal.title || !proposal.description || !proposal.priority || !proposal.actionItems) {
      return undefined;
    }

    return proposal;
  } catch {
    console.error('[GoalAgent] Failed to parse goal proposal JSON');
    return undefined;
  }
}

function removeProposalBlock(content: string): string {
  return content.replace(/===GOAL_PROPOSAL===[\s\S]*?===END_PROPOSAL===\s*/g, '').trim();
}

export async function queryGoalAgent(
  message: string,
  healthContext: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<GoalAgentResponse> {
  // Build conversation context
  const historyText = conversationHistory
    .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n\n');

  const fullPrompt = `## User's Health Data
${healthContext}

## Conversation So Far
${historyText || '(New conversation)'}

## Latest Message from User
${message}

Help the user create a meaningful health goal based on their data.`;

  try {
    const response = query({
      prompt: fullPrompt,
      options: {
        model: 'claude-sonnet-4-5',
        systemPrompt: GOAL_CREATION_SYSTEM_PROMPT,
        permissionMode: 'default',
        maxBudgetUsd: 0.5,
        allowedTools: [],
      },
    });

    let content = '';

    for await (const msg of response) {
      switch (msg.type) {
        case 'assistant':
          if (msg.message && msg.message.content) {
            content += extractTextFromContent(msg.message.content as ContentBlock[]);
          }
          break;
        case 'system':
          if (msg.subtype === 'init') {
            console.log(`[GoalAgent] Session started: ${msg.session_id}`);
          }
          break;
      }
    }

    // Check if there's a goal proposal in the response
    const proposal = parseGoalProposal(content);
    const cleanedContent = removeProposalBlock(content);

    return {
      content: cleanedContent,
      proposal,
    };
  } catch (error) {
    return {
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
