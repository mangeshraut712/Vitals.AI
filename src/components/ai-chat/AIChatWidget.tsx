'use client';

import { useChat } from '@/lib/ai-chat/ChatContext';
import { ChatBar } from './ChatBar';
import { ChatModal } from './ChatModal';
import type { ContextualPill } from '@/lib/ai-chat/generateContextualPills';

interface AIChatWidgetProps {
  contextualPills?: ContextualPill[];
}

/**
 * AIChatWidget - Complete chat widget combining ChatBar and ChatModal
 *
 * Connects to ChatContext for state management.
 * Shows collapsed ChatBar by default, expands to ChatModal on click.
 */
export function AIChatWidget({
  contextualPills,
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

  return (
    <>
      {/* Collapsed state */}
      <ChatBar
        onExpand={expand}
        onPillClick={handlePillClick}
        contextualPills={contextualPills}
      />

      {/* Expanded state */}
      <ChatModal
        isOpen={isExpanded}
        onClose={collapse}
        messages={messages}
        onSendMessage={handleSendMessage}
        inputValue={inputValue}
        onInputChange={setInputValue}
        isLoading={isLoading}
      />
    </>
  );
}

export default AIChatWidget;
