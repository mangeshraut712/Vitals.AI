'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  House,
  LayoutDashboard,
  Target,
  FolderOpen,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

interface DockItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const dockItems: DockItem[] = [
  { href: '/', label: 'Home', icon: House },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/data-sources', label: 'Data', icon: FolderOpen },
  { href: '/experience', label: 'Experience', icon: Sparkles },
];

export function FloatingDock(): React.JSX.Element {
  const pathname = usePathname();
  const hidden =
    pathname === '/tools/agent' || pathname === '/plans/diet' || pathname === '/plans/exercise';

  if (hidden) {
    return <></>;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-40 hidden -translate-x-1/2 lg:block">
      <nav className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-border/80 bg-card/85 p-1.5 shadow-lg backdrop-blur-xl">
        {dockItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={
                active
                  ? 'inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition'
                  : 'inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-accent hover:text-foreground'
              }
            >
              <Icon className="h-4.5 w-4.5" />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
