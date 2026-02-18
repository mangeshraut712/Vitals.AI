'use client';

import { useChat } from '@/lib/ai-chat/ChatContext';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircleHeart, Sparkles } from 'lucide-react';
import { ChatBar } from './ChatBar';
import { ChatModal } from './ChatModal';
import type { ContextualPill } from '@/lib/ai-chat/generateContextualPills';

interface AIChatWidgetProps {
  contextualPills?: ContextualPill[];
  mode?: 'inline' | 'floating';
}

/**
 * AIChatWidget - Complete chat widget combining ChatBar and ChatModal
 *
 * Connects to ChatContext for state management.
 * Shows collapsed ChatBar by default, expands to ChatModal on click.
 */
export function AIChatWidget({
  contextualPills,
  mode = 'inline',
}: AIChatWidgetProps): React.JSX.Element {
  const {
    isExpanded,
    messages,
    inputValue,
    isLoading,
    expand,
    collapse,
    setInputValue,
    prefillInput,
    addMessage,
    updateLastMessage,
    setLoading,
  } = useChat();

  // Handle sending a message
  const handleSendMessage = async (content: string): Promise<void> => {
    // Add user message
    addMessage('user', content);
    setLoading(true);

    try {
      // Add empty assistant message to start streaming into
      addMessage('assistant', '');

      const { streamChatWithAI } = await import('@/lib/ai-chat/chatWithAI');
      const stream = streamChatWithAI(content);

      for await (const chunk of stream) {
        updateLastMessage(chunk);
      }
    } catch (error) {
      console.error('[Vitals.AI] Chat Stream Error:', error);
      updateLastMessage('Sorry, something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle pill click - prefill input and expand
  const handlePillClick = (question: string): void => {
    prefillInput(question);
  };

  const isFloating = mode === 'floating';

  return (
    <>
      {/* Collapsed state */}
      {isFloating ? (
        <AnimatePresence>
          {!isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed bottom-5 right-4 z-[260] sm:bottom-6 sm:right-6"
            >
              <button
                onClick={expand}
                className="group flex items-center gap-3 rounded-2xl border border-border/80 bg-card/95 px-3 py-3 shadow-xl backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-2xl sm:px-4"
                type="button"
                aria-label="Open AI assistant"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl vitals-gradient-bg text-white shadow">
                  <MessageCircleHeart className="h-4.5 w-4.5" />
                </span>
                <div className="hidden text-left sm:block">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Vitals AI
                  </p>
                  <p className="text-sm font-medium text-foreground">Ask anything</p>
                </div>
                <Sparkles className="hidden h-4 w-4 text-cyan-500 sm:block" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <ChatBar
          onExpand={expand}
          onPillClick={handlePillClick}
          contextualPills={contextualPills}
        />
      )}

      {/* Expanded state */}
      <ChatModal
        isOpen={isExpanded}
        onClose={collapse}
        messages={messages}
        onSendMessage={handleSendMessage}
        inputValue={inputValue}
        onInputChange={setInputValue}
        isLoading={isLoading}
        variant={mode}
      />
    </>
  );
}

export default AIChatWidget;
