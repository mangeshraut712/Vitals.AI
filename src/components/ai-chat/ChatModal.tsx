'use client';

import { useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { X, Send, Sparkles } from 'lucide-react';

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

  // Stable callback ref to prevent effect re-subscriptions
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
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isOpen) {
        onCloseRef.current();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

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
      className="fixed inset-0 flex items-start justify-center pt-20 z-[300]"
      onClick={handleBackdropClick}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        animation: 'fadeIn 200ms ease-out',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="AI Chat"
    >
      {/* Modal container with slide-down animation */}
      <div
        ref={modalRef}
        className="w-full flex flex-col bg-card border border-border shadow-2xl rounded-2xl"
        style={{
          maxWidth: '600px',
          maxHeight: '70vh',
          margin: '0 16px',
          animation: 'slideDown 300ms ease-out',
        }}
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl vitals-gradient-bg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-semibold text-foreground">
              Health AI Assistant
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-accent"
            aria-label="Close chat"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-5 py-4" style={{ minHeight: '200px' }}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8 text-muted-foreground">
              <Sparkles className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-sm">
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
          className="px-5 py-4 border-t border-border"
        >
          <div className="flex items-center gap-3 px-4 py-3 bg-muted rounded-full border border-border">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-2 rounded-full transition-all vitals-gradient-bg disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </form>
      </div>
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

  const processInline = (text: string): React.ReactNode => {
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

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true;
      listItems.push(trimmed.slice(2));
      return;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      inList = true;
      listItems.push(trimmed.replace(/^\d+\.\s/, ''));
      return;
    }

    if (inList) {
      flushList();
    }

    if (trimmed === '') {
      elements.push(<div key={index} className="h-2" />);
      return;
    }

    elements.push(
      <p key={index} className="leading-relaxed">
        {processInline(trimmed)}
      </p>
    );
  });

  flushList();

  return <>{elements}</>;
}

// Message bubble component
function MessageBubble({ message }: { message: Message }): React.JSX.Element {
  const isUser = message.role === 'user';

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[80%] px-4 py-2.5 text-sm ${isUser
            ? 'vitals-gradient-bg text-white rounded-2xl rounded-br-sm'
            : 'bg-muted text-foreground rounded-2xl rounded-bl-sm'
          }`}
      >
        {isUser ? message.content : renderMarkdown(message.content)}
      </div>
      <span className="text-[10px] mt-1 px-1 text-muted-foreground">
        {formatTimestamp(message.timestamp)}
      </span>
    </div>
  );
}

// Loading indicator
function LoadingIndicator(): React.JSX.Element {
  return (
    <div className="flex justify-start">
      <div className="px-4 py-3 flex items-center gap-1 bg-muted rounded-2xl rounded-bl-sm">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export default ChatModal;
