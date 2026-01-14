'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CARD_CLASSES, GRADIENTS } from '@/lib/design/tokens';
import type { GoalProposal } from '@/lib/agent/goal-agent';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  proposal?: GoalProposal;
}

interface GoalChatProps {
  onGoalAccepted: (proposal: GoalProposal) => void;
}

interface ChatApiResponse {
  success: boolean;
  content?: string;
  proposal?: GoalProposal;
  error?: string;
}

export function GoalChat({ onGoalAccepted }: GoalChatProps): React.JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingProposal, setPendingProposal] = useState<GoalProposal | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, pendingProposal]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    // Add user message
    const userMessage: Message = { role: 'user', content: trimmedInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    setPendingProposal(null);

    try {
      // Build conversation history for context
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/goals/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmedInput,
          conversationHistory,
        }),
      });

      const data = (await response.json()) as ChatApiResponse;

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to get response');
      }

      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.content ?? '',
        proposal: data.proposal,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // If there's a proposal, show it
      if (data.proposal) {
        setPendingProposal(data.proposal);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);

      // Add error message to chat
      const errorMessageObj: Message = {
        role: 'assistant',
        content: `Error: ${errorMessage}. Please try again.`,
      };
      setMessages((prev) => [...prev, errorMessageObj]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptGoal = (): void => {
    if (pendingProposal) {
      onGoalAccepted(pendingProposal);
      setPendingProposal(null);
    }
  };

  const handleRefineGoal = (): void => {
    setPendingProposal(null);
    setInput('I want to refine this goal. ');
  };

  const getPriorityGradient = (priority: string): string => {
    switch (priority) {
      case 'high':
        return GRADIENTS.high;
      case 'medium':
        return GRADIENTS.medium;
      case 'low':
        return GRADIENTS.low;
      default:
        return GRADIENTS.low;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[200px]">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            <p className="mb-2 font-medium">Tell me about your goal</p>
            <p className="text-sm text-slate-400">
              Examples: &quot;I want to get stronger&quot; or &quot;Help me improve my sleep&quot;
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-xl px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                />
                <div
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Goal Proposal Card */}
      {pendingProposal && (
        <div className="mb-4">
          <div
            className="rounded-xl p-4 text-white"
            style={{ background: getPriorityGradient(pendingProposal.priority) }}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-lg">{pendingProposal.title}</h4>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full uppercase">
                {pendingProposal.priority}
              </span>
            </div>
            <p className="text-sm text-white/90 mb-3">{pendingProposal.description}</p>
            <div className="text-xs text-white/80 mb-3">
              <span className="bg-white/20 px-2 py-1 rounded">{pendingProposal.category}</span>
            </div>
            <ul className="text-sm space-y-1 mb-4">
              {pendingProposal.actionItems.slice(0, 3).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-white/60">•</span>
                  <span className="text-white/90">{item}</span>
                </li>
              ))}
              {pendingProposal.actionItems.length > 3 && (
                <li className="text-white/60 text-xs">
                  +{pendingProposal.actionItems.length - 3} more actions
                </li>
              )}
            </ul>
            <div className="flex gap-2">
              <Button
                onClick={handleAcceptGoal}
                className="flex-1 bg-white text-slate-900 hover:bg-white/90"
              >
                Add Goal
              </Button>
              <Button
                onClick={handleRefineGoal}
                variant="outline"
                className="flex-1 border-white/30 text-white hover:bg-white/10"
              >
                Keep Refining
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="text-red-500 text-sm mb-2 p-2 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your goal..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? '...' : 'Send'}
        </Button>
      </form>
    </div>
  );
}
