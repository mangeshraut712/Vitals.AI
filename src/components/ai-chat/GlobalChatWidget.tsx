'use client';

import { usePathname } from 'next/navigation';
import { ChatProvider } from '@/lib/ai-chat/ChatContext';
import { AIChatWidget } from './AIChatWidget';

export function GlobalChatWidget(): React.JSX.Element | null {
  const pathname = usePathname();

  if (pathname === '/tools/agent') {
    return null;
  }

  return (
    <ChatProvider>
      <AIChatWidget />
    </ChatProvider>
  );
}

