import { TopNav } from '@/components/layout/TopNav';
import { GlobalChatWidget } from '@/components/ai-chat/GlobalChatWidget';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <TopNav />
      {/* Main content with top padding for floating nav */}
      <main className="pt-20 pb-12">{children}</main>
      <GlobalChatWidget />
      {/* Subtle gradient background accent */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-chart-2/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
