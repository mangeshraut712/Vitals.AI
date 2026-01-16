'use client';

import { BACKGROUNDS, BORDERS, SHADOWS, TEXT_COLORS, RADIUS, GRADIENTS } from '@/lib/design/tokens';

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
    e.stopPropagation(); // Prevent bar click handler
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
      className="w-full cursor-pointer transition-all duration-200 hover:scale-[1.01]"
      style={{
        background: BACKGROUNDS.card,
        borderRadius: RADIUS.full,
        boxShadow: SHADOWS.md,
        border: `1px solid ${BORDERS.light}`,
        padding: '12px 20px',
      }}
      aria-label="Open AI chat"
    >
      <div className="flex items-center gap-4">
        {/* Left: AI Sparkle Icon */}
        <div
          className="flex-shrink-0 flex items-center justify-center"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: RADIUS.md,
            background: GRADIENTS.ai,
          }}
        >
          <SparkleIcon />
        </div>

        {/* Center: Placeholder text */}
        <span
          className="flex-1 text-sm truncate"
          style={{ color: TEXT_COLORS.muted }}
        >
          Ask anything about your health...
        </span>

        {/* Right: Contextual pill buttons */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {contextualPills.slice(0, 3).map((pill) => (
            <button
              key={pill.id}
              onClick={(e) => handlePillClick(e, pill.label)}
              className="hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-medium transition-all duration-150 hover:scale-105"
              style={{
                background: BACKGROUNDS.accent,
                color: TEXT_COLORS.secondary,
                borderRadius: RADIUS.full,
                border: `1px solid ${BORDERS.light}`,
              }}
              type="button"
            >
              {pill.label}
            </button>
          ))}
          {/* Mobile: Show icon hint instead */}
          <div
            className="sm:hidden flex items-center justify-center"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: RADIUS.full,
              background: BACKGROUNDS.accent,
            }}
          >
            <ChevronRightIcon />
          </div>
        </div>
      </div>
    </div>
  );
}

// Sparkle/AI Icon
function SparkleIcon(): React.JSX.Element {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

// Chevron Right Icon (for mobile)
function ChevronRightIcon(): React.JSX.Element {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={TEXT_COLORS.muted}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export default ChatBar;
