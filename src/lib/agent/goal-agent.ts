import Anthropic from '@anthropic-ai/sdk';

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

function inferGoalCategory(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes('sleep') || normalized.includes('insomnia')) return 'Sleep';
  if (normalized.includes('weight') || normalized.includes('fat') || normalized.includes('muscle')) return 'Fitness';
  if (normalized.includes('cholesterol') || normalized.includes('blood pressure') || normalized.includes('heart')) return 'Cardiovascular';
  if (normalized.includes('glucose') || normalized.includes('a1c') || normalized.includes('insulin')) return 'Metabolic';
  if (normalized.includes('food') || normalized.includes('diet') || normalized.includes('protein')) return 'Nutrition';
  if (normalized.includes('longevity') || normalized.includes('age')) return 'Longevity';
  if (normalized.includes('stress') || normalized.includes('anxiety') || normalized.includes('mood')) return 'Mental Health';
  return 'Other';
}

function inferGoalPriority(message: string): 'high' | 'medium' | 'low' {
  const normalized = message.toLowerCase();
  if (normalized.includes('urgent') || normalized.includes('critical') || normalized.includes('high')) {
    return 'high';
  }
  if (normalized.includes('improve') || normalized.includes('optimize') || normalized.includes('fix')) {
    return 'medium';
  }
  return 'low';
}

function buildFallbackActionItems(category: string): string[] {
  switch (category) {
    case 'Sleep':
      return [
        'Set a fixed bedtime and wake time for at least 14 days',
        'Avoid caffeine within 8 hours of bedtime',
        'Track sleep duration and sleep quality each morning',
      ];
    case 'Fitness':
      return [
        'Schedule 3 focused training sessions per week',
        'Track steps daily and target a weekly average increase',
        'Review progress every Sunday and adjust intensity',
      ];
    case 'Cardiovascular':
      return [
        'Target 150 minutes of Zone 2 cardio per week',
        'Reduce saturated fat and increase soluble fiber intake',
        'Retest key lipids in 8-12 weeks',
      ];
    case 'Metabolic':
      return [
        'Use a protein-first meal structure at each meal',
        'Walk for 10-15 minutes after lunch and dinner',
        'Track fasting glucose trend and weekly adherence',
      ];
    case 'Nutrition':
      return [
        'Plan meals for the next 7 days in advance',
        'Hit a consistent daily protein target',
        'Limit ultra-processed snacks to pre-defined windows',
      ];
    case 'Longevity':
      return [
        'Prioritize sleep, recovery, and consistency over intensity',
        'Track top 3 biomarkers to improve each week',
        'Review protocol and update goals every 30 days',
      ];
    case 'Mental Health':
      return [
        'Block 10 minutes daily for stress-regulation practice',
        'Use a consistent wind-down routine each evening',
        'Track mood/energy daily and identify trigger patterns',
      ];
    default:
      return [
        'Define a measurable weekly target and baseline',
        'Track completion daily in a simple checklist',
        'Review results every 14 days and iterate',
      ];
  }
}

function buildFallbackProposal(message: string): GoalProposal {
  const category = inferGoalCategory(message);
  const priority = inferGoalPriority(message);
  const cleanedMessage = message.trim();
  const title = cleanedMessage
    ? `Improve ${cleanedMessage.split(/\s+/).slice(0, 4).join(' ')}`
    : 'Improve Daily Health Consistency';

  return {
    title,
    description:
      'This draft goal was generated locally because the AI goal engine is unavailable. You can refine it in chat and then save it.',
    priority,
    category,
    actionItems: buildFallbackActionItems(category),
  };
}

function buildFallbackGoalContent(message: string): string {
  return `I can still draft a structured goal while the advanced goal AI is temporarily unavailable.\n\nYour request: "${message}"\n\nReview the proposed goal below, then accept it or continue refining.`;
}

export async function queryGoalAgent(
  message: string,
  healthContext: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<GoalAgentResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

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

  if (!apiKey) {
    return {
      content: buildFallbackGoalContent(message),
      proposal: buildFallbackProposal(message),
    };
  }

  try {
    const anthropic = new Anthropic({
      apiKey,
    });

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 1024,
      system: GOAL_CREATION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: fullPrompt }],
    });

    const content = response.content
      .map((block) => ('text' in block ? block.text : ''))
      .join('')
      .trim();

    // Check if there's a goal proposal in the response
    const proposal = parseGoalProposal(content);
    const cleanedContent = removeProposalBlock(content) || buildFallbackGoalContent(message);

    return {
      content: cleanedContent,
      proposal,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.warn('[GoalAgent] Falling back to local proposal:', errorMessage);

    return {
      content: buildFallbackGoalContent(message),
      proposal: buildFallbackProposal(message),
      error: errorMessage,
    };
  }
}
