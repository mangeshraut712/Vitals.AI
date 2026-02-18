import { TopNav } from '@/components/layout/TopNav';
import { GlobalChatWidget } from '@/components/ai-chat/GlobalChatWidget';
import { PwaBootstrap } from '@/components/layout/PwaBootstrap';
import { FloatingDock } from '@/components/layout/FloatingDock';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <TopNav />
      {/* Main content with top padding for floating nav */}
      <main className="pt-20 pb-28">{children}</main>
      <GlobalChatWidget />
      <PwaBootstrap />
      <FloatingDock />
      {/* Subtle gradient background accent */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-16 right-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_40%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_40%)]" />
      </div>
    </div>
  );
}
