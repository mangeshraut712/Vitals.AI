'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BACKGROUNDS, TEXT_COLORS, BORDERS, ANIMATION } from '@/lib/design/tokens';

interface TabItem {
  href: string;
  label: string;
}

const tabs: TabItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/biomarkers', label: 'Biomarkers' },
  { href: '/lifestyle', label: 'Lifestyle' },
  { href: '/body-comp', label: 'Body Comp' },
  { href: '/goals', label: 'Goals' },
  { href: '/data-sources', label: 'Data Sources' },
];

export function TabNav(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-lg font-semibold text-slate-900">HealthAI</span>
          </Link>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`
                    relative px-4 py-2 text-sm font-medium rounded-lg
                    transition-all duration-200 ease-out
                    ${
                      isActive
                        ? 'text-emerald-700 bg-emerald-50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }
                  `}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
