'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useTheme } from 'next-themes';
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
  Sun,
  Moon,
  Zap,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  name: string;
  href?: string;
  icon: LucideIcon;
  children?: { name: string; href: string; icon: LucideIcon }[];
}

const navItems: NavItem[] = [
  { name: 'Home', href: '/', icon: Home },
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
      { name: 'Vitals 2.0', href: '/future', icon: Zap },
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
          ${
            isActive || isOpen
              ? 'text-foreground bg-accent'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
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
            className="absolute top-full left-0 mt-2 min-w-[180px] py-1.5 rounded-xl bg-popover border border-border shadow-lg z-50"
            style={{
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
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
                    ${
                      isChildActive
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
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
        ${
          isActive
            ? 'text-foreground bg-accent'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
        }
      `}
    >
      {item.name}
    </Link>
  );
}

function MobileNavPanel({ onNavigate }: { onNavigate: () => void }): React.JSX.Element {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      {navItems.map((item) => {
        const active = isPathActive(pathname, item);

        if (item.href) {
          const ItemIcon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={`
                flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors
                ${active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent'}
              `}
            >
              <ItemIcon className="w-4 h-4" />
              <span>{item.name}</span>
            </Link>
          );
        }

        return (
          <section key={item.name}>
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {item.name}
            </p>
            <div className="mt-1 space-y-1">
              {item.children?.map((child) => {
                const ChildIcon = child.icon;
                const childActive = pathname === child.href || pathname.startsWith(child.href + '/');

                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={onNavigate}
                    className={`
                      flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors
                      ${childActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent'}
                    `}
                  >
                    <ChildIcon className="w-4 h-4" />
                    <span>{child.name}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ThemeToggle(): React.JSX.Element {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8" />;
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4" strokeWidth={2} />
      ) : (
        <Moon className="w-4 h-4" strokeWidth={2} />
      )}
    </button>
  );
}

export function TopNav(): React.JSX.Element {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();

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

  const handleMobileClose = (): void => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 pointer-events-none"
        style={{ y: navY }}
      >
        <motion.div
          className="flex items-center gap-2 bg-background/80 backdrop-blur-xl border border-border shadow-lg rounded-full pointer-events-auto max-w-[calc(100vw-1rem)]"
          style={{ padding: pillPadding }}
        >
          <motion.div style={{ opacity: logoOpacity, scale: logoScale }} className="origin-left">
            <Link href="/" className="flex items-center gap-2 pl-2 pr-3">
              <div className="w-8 h-8 rounded-xl vitals-gradient-bg flex items-center justify-center shadow-sm">
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
              <span className="text-sm font-semibold text-foreground">Vitals.AI</span>
            </Link>
          </motion.div>

          <motion.div style={{ opacity: logoOpacity }} className="w-px h-6 bg-border hidden md:block" />

          <div className="hidden md:flex items-center gap-0.5 px-1">
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

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation-menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-4 h-4" strokeWidth={2} />
            ) : (
              <Menu className="w-4 h-4" strokeWidth={2} />
            )}
          </button>

          <div className="w-px h-6 bg-border" />
          <ThemeToggle />
        </motion.div>
      </motion.nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={handleMobileClose}
              aria-label="Close mobile navigation backdrop"
            />
            <motion.div
              id="mobile-navigation-menu"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="fixed top-20 left-4 right-4 z-50 md:hidden vitals-card p-4 max-h-[70vh] overflow-y-auto"
            >
              <MobileNavPanel onNavigate={handleMobileClose} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
