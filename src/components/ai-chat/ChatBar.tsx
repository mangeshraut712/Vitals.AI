'use client';

import { Sparkles, ChevronRight } from 'lucide-react';

interface ContextualPill {
  id: string;
  label: string;
}

interface ChatBarProps {
  onExpand: () => void;
  onPillClick: (question: string) => void;
  contextualPills?: ContextualPill[];
}

// Default pills shown when no data-driven pills are provided
const DEFAULT_PILLS: ContextualPill[] = [
  { id: 'default-1', label: 'What should I improve?' },
  { id: 'default-2', label: 'Am I healthy?' },
];

/**
 * ChatBar - Collapsed state of the AI chat interface
 *
 * A pill-shaped bar that expands into the full chat modal when clicked.
 * Shows contextual question suggestions based on user's health data.
 */
export function ChatBar({
  onExpand,
  onPillClick,
  contextualPills = DEFAULT_PILLS,
}: ChatBarProps): React.JSX.Element {
  const handleBarClick = (): void => {
    onExpand();
  };

  const handlePillClick = (e: React.MouseEvent, question: string): void => {
    e.stopPropagation();
    onPillClick(question);
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      onExpand();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleBarClick}
      onKeyDown={handleKeyDown}
      className="w-full cursor-pointer transition-all duration-200 hover:scale-[1.005] rounded-2xl border border-border bg-card/90 px-5 py-3 shadow-sm backdrop-blur-xl"
      aria-label="Open AI chat"
    >
      <div className="flex items-center gap-4">
        {/* Left: AI Sparkle Icon */}
        <div className="flex-shrink-0 w-9 h-9 rounded-xl vitals-gradient-bg flex items-center justify-center shadow-sm">
          <Sparkles className="w-4 h-4 text-white" />
        </div>

        {/* Center: Placeholder text */}
        <span className="flex-1 text-sm text-muted-foreground truncate">
          Ask anything about your health...
        </span>

        {/* Right: Contextual pill buttons */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {contextualPills.slice(0, 3).map((pill) => (
            <button
              key={pill.id}
              onClick={(e) => handlePillClick(e, pill.label)}
              className="hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-medium transition-all duration-150 hover:scale-105 bg-secondary text-muted-foreground rounded-full border border-border hover:text-foreground hover:bg-accent"
              type="button"
            >
              {pill.label}
            </button>
          ))}
          {/* Mobile: Show icon hint instead */}
          <div className="sm:hidden w-7 h-7 flex items-center justify-center bg-muted rounded-full">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatBar;
