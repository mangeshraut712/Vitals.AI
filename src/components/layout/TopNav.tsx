'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Home,
  Database,
  Target,
  ClipboardList,
  Activity,
  Beaker,
  Heart,
  FolderOpen,
  Utensils,
  Dumbbell,
  ChevronDown,
  Wrench,
  BookOpen,
  AlertTriangle,
  Bot,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  name: string;
  href?: string;
  icon: LucideIcon;
  children?: { name: string; href: string; icon: LucideIcon }[];
}

const navItems: NavItem[] = [
  { name: 'Home', href: '/dashboard', icon: Home },
  {
    name: 'Data',
    icon: Database,
    children: [
      { name: 'Body Comp', href: '/body-comp', icon: Activity },
      { name: 'Biomarkers', href: '/biomarkers', icon: Beaker },
      { name: 'Lifestyle', href: '/lifestyle', icon: Heart },
      { name: 'Sources', href: '/data-sources', icon: FolderOpen },
    ],
  },
  {
    name: 'Plans',
    icon: ClipboardList,
    children: [
      { name: 'Diet & Supplements', href: '/plans/diet', icon: Utensils },
      { name: 'Exercise', href: '/plans/exercise', icon: Dumbbell },
    ],
  },
  { name: 'Goals', href: '/goals', icon: Target },
  {
    name: 'Tools',
    icon: Wrench,
    children: [
      { name: 'Guides', href: '/tools/guides', icon: BookOpen },
      { name: 'Disclaimers', href: '/tools/disclaimers', icon: AlertTriangle },
      { name: 'Agent [Beta]', href: '/tools/agent', icon: Bot },
    ],
  },
];

function isPathActive(pathname: string, item: NavItem): boolean {
  if (item.href) {
    return pathname === item.href || pathname.startsWith(item.href + '/');
  }
  if (item.children) {
    return item.children.some(
      (child) => pathname === child.href || pathname.startsWith(child.href + '/')
    );
  }
  return false;
}

interface DropdownProps {
  item: NavItem;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

function NavDropdown({ item, isOpen, onToggle, onClose }: DropdownProps): React.JSX.Element {
  const pathname = usePathname();
  const isActive = isPathActive(pathname, item);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const Icon = item.icon;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={onToggle}
        className={`
          flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium
          transition-all duration-200
          ${isActive || isOpen
            ? 'text-gray-900 bg-gray-100'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }
        `}
      >
        <span>{item.name}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full left-0 mt-2 min-w-[180px] py-1.5 rounded-xl bg-white border border-gray-200 shadow-lg shadow-gray-200/50 z-50"
          >
            {item.children?.map((child) => {
              const ChildIcon = child.icon;
              const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/');

              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-2.5 px-3 py-2 mx-1.5 rounded-lg text-sm
                    transition-all duration-150
                    ${isChildActive
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <ChildIcon className="w-4 h-4" strokeWidth={1.75} />
                  <span>{child.name}</span>
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavLink({ item }: { item: NavItem }): React.JSX.Element {
  const pathname = usePathname();
  const isActive = isPathActive(pathname, item);

  return (
    <Link
      href={item.href!}
      className={`
        px-3 py-2 rounded-full text-sm font-medium
        transition-all duration-200
        ${isActive
          ? 'text-gray-900 bg-gray-100'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }
      `}
    >
      {item.name}
    </Link>
  );
}

export function TopNav(): React.JSX.Element {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { scrollY } = useScroll();

  // Transform values based on scroll
  const logoOpacity = useTransform(scrollY, [0, 60], [1, 0]);
  const logoScale = useTransform(scrollY, [0, 60], [1, 0.8]);
  const navY = useTransform(scrollY, [0, 60], [0, 0]);
  const pillPadding = useTransform(scrollY, [0, 60], [6, 4]);

  const handleToggle = (name: string): void => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const handleClose = (): void => {
    setOpenDropdown(null);
  };

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 pointer-events-none"
      style={{ y: navY }}
    >
      <motion.div
        className="flex items-center gap-2 bg-white/80 backdrop-blur-xl border border-gray-200/60 shadow-lg shadow-gray-200/30 rounded-full pointer-events-auto"
        style={{ padding: pillPadding }}
      >
        {/* Logo - fades on scroll */}
        <motion.div
          style={{ opacity: logoOpacity, scale: logoScale }}
          className="origin-left"
        >
          <Link href="/dashboard" className="flex items-center gap-2 pl-2 pr-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4.5 w-4.5 text-white"
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
            <span className="text-sm font-semibold text-gray-900">HealthAI</span>
          </Link>
        </motion.div>

        {/* Divider - fades with logo */}
        <motion.div
          style={{ opacity: logoOpacity }}
          className="w-px h-6 bg-gray-200"
        />

        {/* Navigation Items */}
        <div className="flex items-center gap-0.5 px-1">
          {navItems.map((item) =>
            item.children ? (
              <NavDropdown
                key={item.name}
                item={item}
                isOpen={openDropdown === item.name}
                onToggle={() => handleToggle(item.name)}
                onClose={handleClose}
              />
            ) : (
              <NavLink key={item.name} item={item} />
            )
          )}
        </div>
      </motion.div>
    </motion.nav>
  );
}
