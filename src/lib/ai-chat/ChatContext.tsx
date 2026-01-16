'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

// Message interface for chat
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Chat context state interface
interface ChatState {
  isExpanded: boolean;
  messages: ChatMessage[];
  inputValue: string;
  isLoading: boolean;
}

// Chat context actions interface
interface ChatActions {
  expand: () => void;
  collapse: () => void;
  toggle: () => void;
  setInputValue: (value: string) => void;
  prefillInput: (question: string) => void;
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

// Combined context type
interface ChatContextType extends ChatState, ChatActions {}

// Create context with undefined default
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Generate unique ID for messages
function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * ChatProvider - Provides chat state to children components
 *
 * Manages:
 * - isExpanded: whether chat modal is open
 * - messages: chat history
 * - inputValue: current input field value
 * - isLoading: whether AI is responding
 */
export function ChatProvider({ children }: { children: ReactNode }): React.JSX.Element {
  // State
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Actions
  const expand = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const collapse = useCallback(() => {
    setIsExpanded(false);
  }, []);

  const toggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const prefillInput = useCallback((question: string) => {
    setInputValue(question);
    setIsExpanded(true);
  }, []);

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const message: ChatMessage = {
      id: generateId(),
      role,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);

    // Clear input after adding user message
    if (role === 'user') {
      setInputValue('');
    }
  }, []);

  const setLoadingState = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Context value
  const value: ChatContextType = {
    // State
    isExpanded,
    messages,
    inputValue,
    isLoading,
    // Actions
    expand,
    collapse,
    toggle,
    setInputValue,
    prefillInput,
    addMessage,
    setLoading: setLoadingState,
    clearMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

/**
 * useChat - Hook to access chat context
 *
 * Must be used within a ChatProvider
 */
export function useChat(): ChatContextType {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

export default ChatContext;
