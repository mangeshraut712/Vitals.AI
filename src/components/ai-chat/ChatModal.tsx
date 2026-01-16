'use client';

import { useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import {
  BACKGROUNDS,
  BORDERS,
  SHADOWS,
  TEXT_COLORS,
  RADIUS,
  Z_INDEX,
  ANIMATION,
  GRADIENTS,
  AI_COLORS,
} from '@/lib/design/tokens';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onSendMessage: (content: string) => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  isLoading?: boolean;
}

/**
 * ChatModal - Expanded state of the AI chat interface
 *
 * Slides down from ChatBar position with a blurred backdrop.
 * Contains message list and input field for chatting with AI.
 */
export function ChatModal({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  inputValue,
  onInputChange,
  isLoading = false,
}: ChatModalProps): React.JSX.Element | null {
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Stable callback ref to prevent effect re-subscriptions (Rule 8.2)
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to allow animation to start
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle ESC key to close modal - uses ref for stable subscription (Rule 5.3)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isOpen) {
        onCloseRef.current();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]); // Only re-subscribe when isOpen changes, not on every onClose change

  // Handle click outside to close
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): void => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Handle form submission
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-start justify-center pt-20"
      onClick={handleBackdropClick}
      style={{
        zIndex: Z_INDEX.modal,
        backgroundColor: BACKGROUNDS.overlay,
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        animation: `fadeIn ${ANIMATION.duration.normal} ${ANIMATION.easing.out}`,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="AI Chat"
    >
      {/* Modal container with slide-down animation */}
      <div
        ref={modalRef}
        className="w-full flex flex-col"
        style={{
          maxWidth: '600px',
          maxHeight: '70vh',
          margin: '0 16px',
          background: BACKGROUNDS.card,
          borderRadius: RADIUS.lg,
          boxShadow: SHADOWS.xl,
          border: `1px solid ${BORDERS.light}`,
          animation: `slideDown ${ANIMATION.duration.slow} ${ANIMATION.easing.out}`,
        }}
      >
        {/* Header with close button */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{
            borderBottom: `1px solid ${BORDERS.light}`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: RADIUS.md,
                background: GRADIENTS.ai,
              }}
            >
              <SparkleIcon />
            </div>
            <h2
              className="font-semibold"
              style={{ color: TEXT_COLORS.primary }}
            >
              Health AI Assistant
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-slate-100"
            aria-label="Close chat"
            type="button"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Messages area */}
        <div
          className="flex-1 overflow-y-auto px-5 py-4"
          style={{ minHeight: '200px' }}
        >
          {messages.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-full text-center py-8"
              style={{ color: TEXT_COLORS.muted }}
            >
              <SparkleIconLarge />
              <p className="mt-4 text-sm">
                Ask me anything about your health data.
              </p>
              <p className="mt-1 text-xs">
                I can help explain your biomarkers, suggest improvements, and answer questions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isLoading && <LoadingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <form
          onSubmit={handleSubmit}
          className="px-5 py-4"
          style={{
            borderTop: `1px solid ${BORDERS.light}`,
          }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{
              background: BACKGROUNDS.accent,
              borderRadius: RADIUS.full,
              border: `1px solid ${BORDERS.light}`,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: TEXT_COLORS.primary }}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-2 rounded-full transition-all"
              style={{
                background:
                  inputValue.trim() && !isLoading
                    ? GRADIENTS.ai
                    : BACKGROUNDS.accent,
                opacity: inputValue.trim() && !isLoading ? 1 : 0.5,
                cursor:
                  inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
              }}
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </div>
        </form>
      </div>

      {/* CSS animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

// Format timestamp for display
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return date.toLocaleDateString();
}

// Simple markdown renderer for AI messages
function renderMarkdown(content: string): React.JSX.Element {
  // Split by lines and process
  const lines = content.split('\n');
  const elements: React.JSX.Element[] = [];
  let listItems: string[] = [];
  let inList = false;

  const flushList = (): void => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc pl-5 my-2 space-y-1">
          {listItems.map((item, i) => (
            <li key={i}>{processInline(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
    inList = false;
  };

  // Process inline formatting (bold, italic)
  const processInline = (text: string): React.ReactNode => {
    // Bold: **text** or __text__
    const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('__') && part.endsWith('__')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Bullet list item
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true;
      listItems.push(trimmed.slice(2));
      return;
    }

    // Numbered list item
    if (/^\d+\.\s/.test(trimmed)) {
      inList = true;
      listItems.push(trimmed.replace(/^\d+\.\s/, ''));
      return;
    }

    // Flush any pending list
    if (inList) {
      flushList();
    }

    // Empty line
    if (trimmed === '') {
      elements.push(<div key={index} className="h-2" />);
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={index} className="leading-relaxed">
        {processInline(trimmed)}
      </p>
    );
  });

  // Flush any remaining list
  flushList();

  return <>{elements}</>;
}

// Message bubble component
function MessageBubble({ message }: { message: Message }): React.JSX.Element {
  const isUser = message.role === 'user';

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className="max-w-[80%] px-4 py-2.5 text-sm"
        style={{
          background: isUser
            ? GRADIENTS.ai
            : BACKGROUNDS.accent,
          color: isUser ? TEXT_COLORS.inverse : TEXT_COLORS.primary,
          borderRadius: isUser
            ? `${RADIUS.lg} ${RADIUS.lg} ${RADIUS.sm} ${RADIUS.lg}`
            : `${RADIUS.lg} ${RADIUS.lg} ${RADIUS.lg} ${RADIUS.sm}`,
        }}
      >
        {isUser ? message.content : renderMarkdown(message.content)}
      </div>
      {/* Timestamp */}
      <span
        className="text-[10px] mt-1 px-1"
        style={{ color: TEXT_COLORS.muted }}
      >
        {formatTimestamp(message.timestamp)}
      </span>
    </div>
  );
}

// Hoisted static JSX for loading dots (Rule 6.3) - avoids recreation on every render
const loadingDots = [0, 1, 2].map((i) => (
  <div
    key={i}
    className="w-2 h-2 rounded-full animate-bounce"
    style={{
      backgroundColor: TEXT_COLORS.muted,
      animationDelay: `${i * 150}ms`,
    }}
  />
));

// Loading indicator
function LoadingIndicator(): React.JSX.Element {
  return (
    <div className="flex justify-start">
      <div
        className="px-4 py-3 flex items-center gap-1"
        style={{
          background: BACKGROUNDS.accent,
          borderRadius: `${RADIUS.lg} ${RADIUS.lg} ${RADIUS.lg} ${RADIUS.sm}`,
        }}
      >
        {loadingDots}
      </div>
    </div>
  );
}

// Icons
function SparkleIcon(): React.JSX.Element {
  return (
    <svg
      width="16"
      height="16"
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

function SparkleIconLarge(): React.JSX.Element {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke={TEXT_COLORS.muted}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function CloseIcon(): React.JSX.Element {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={TEXT_COLORS.secondary}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function SendIcon(): React.JSX.Element {
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
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

export default ChatModal;
