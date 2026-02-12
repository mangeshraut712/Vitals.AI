'use client';

import { useEffect, useCallback } from 'react';
import { GoalChat } from './GoalChat';
import { SHADOWS, Z_INDEX, ANIMATION } from '@/lib/design/tokens';
import type { GoalProposal } from '@/lib/agent/goal-agent';

interface CreateGoalPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onGoalCreated: (proposal: GoalProposal) => void;
}

export function CreateGoalPanel({
  isOpen,
  onClose,
  onGoalCreated,
}: CreateGoalPanelProps): React.JSX.Element | null {
  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const handleGoalAccepted = async (proposal: GoalProposal): Promise<void> => {
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: proposal.title,
          description: proposal.description,
          priority: proposal.priority,
          category: proposal.category,
          actionItems: proposal.actionItems,
        }),
      });

      const data = (await response.json()) as { success: boolean; error?: string };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to save goal');
      }

      onGoalCreated(proposal);
      onClose();
    } catch (error) {
      console.error('[CreateGoalPanel] Failed to save goal:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 transition-opacity"
        style={{ zIndex: Z_INDEX.modal }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-card flex flex-col"
        style={{
          zIndex: Z_INDEX.modal + 1,
          boxShadow: SHADOWS.xl,
          animation: `slideIn ${ANIMATION.duration.normal} ${ANIMATION.easing.out}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Create a Goal</h2>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-muted-foreground hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close panel"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M15 5L5 15M5 5l10 10" />
            </svg>
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden p-4">
          <GoalChat onGoalAccepted={handleGoalAccepted} />
        </div>
      </div>

      {/* Slide-in animation */}
      <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
