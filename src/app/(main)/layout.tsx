import { TopNav } from '@/components/layout/TopNav';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <TopNav />
      {/* Main content with top padding for floating nav */}
      <main className="pt-20">{children}</main>
    </div>
  );
}
