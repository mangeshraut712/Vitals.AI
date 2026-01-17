/**
 * Design Tokens - Single source of truth for Vitals.AI visual design
 *
 * Inspired by clinical health dashboards like InsideTracker.
 * Uses a refined, professional aesthetic with clear status colors.
 */

// ============================================================================
// STATUS COLORS - Used consistently for health indicators
// ============================================================================

export const STATUS_COLORS = {
  optimal: {
    base: '#10b981', // Emerald green
    light: '#d1fae5', // Light background
    text: '#065f46', // Dark text on light bg
  },
  normal: {
    base: '#eab308', // Yellow
    light: '#fef9c3', // Light background
    text: '#854d0e', // Dark text on light bg
  },
  outOfRange: {
    base: '#ec4899', // Pink
    light: '#fce7f3', // Light background
    text: '#9d174d', // Dark text on light bg
  },
} as const;

// ============================================================================
// BACKGROUND COLORS
// ============================================================================

export const BACKGROUNDS = {
  page: '#f8fafc', // Slate-50 - main page background
  card: '#ffffff', // White cards
  cardHover: '#f9fafb', // Subtle hover
  accent: '#f1f5f9', // Slightly darker for sections
  overlay: 'rgba(15, 23, 42, 0.5)', // Modal overlay
} as const;

// ============================================================================
// TEXT COLORS
// ============================================================================

export const TEXT_COLORS = {
  primary: '#0f172a', // Slate-900 - headings
  secondary: '#475569', // Slate-600 - body text
  muted: '#94a3b8', // Slate-400 - labels, hints
  inverse: '#ffffff', // White text on dark bg
} as const;

// ============================================================================
// BORDER & SHADOW
// ============================================================================

export const BORDERS = {
  light: '#e2e8f0', // Slate-200
  medium: '#cbd5e1', // Slate-300
  focus: '#3b82f6', // Blue-500 for focus rings
} as const;

export const SHADOWS = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const RADIUS = {
  sm: '6px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
} as const;

// ============================================================================
// SPACING
// ============================================================================

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
} as const;

// ============================================================================
// GRADIENT BACKGROUNDS (for goal cards by priority)
// ============================================================================

export const GRADIENTS = {
  high: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)', // Red to orange
  medium: 'linear-gradient(135deg, #f59e0b 0%, #eab308 100%)', // Amber to yellow
  low: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)', // Blue to cyan
  success: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', // Green gradient
  ai: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)', // Teal gradient for AI elements
} as const;

// AI-specific colors (health-appropriate teal)
export const AI_COLORS = {
  primary: '#0d9488', // Teal-600
  light: '#14b8a6', // Teal-500
  bg: '#f0fdfa', // Teal-50
  text: '#134e4a', // Teal-900
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const TYPOGRAPHY = {
  fontFamily: {
    sans: '"Geist", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"Geist Mono", "SF Mono", Consolas, monospace',
  },
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const;

// ============================================================================
// Z-INDEX
// ============================================================================

export const Z_INDEX = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 300,
  tooltip: 400,
  toast: 500,
} as const;

// ============================================================================
// ANIMATION
// ============================================================================

export const ANIMATION = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// ============================================================================
// TAILWIND UTILITY CLASSES
// ============================================================================

/**
 * Status classes for Tailwind - use these for consistent status styling
 */
export const STATUS_CLASSES = {
  optimal: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  normal: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    dot: 'bg-yellow-500',
    badge: 'bg-yellow-100 text-yellow-700',
  },
  outOfRange: {
    bg: 'bg-pink-100',
    text: 'text-pink-700',
    border: 'border-pink-200',
    dot: 'bg-pink-500',
    badge: 'bg-pink-100 text-pink-700',
  },
} as const;

/**
 * Card styles
 */
export const CARD_CLASSES = {
  base: 'bg-white rounded-xl shadow-sm border border-slate-100',
  hover: 'hover:shadow-md transition-shadow duration-200',
  padding: 'p-6',
};

/**
 * Get status type from a health status string
 */
export type StatusType = 'optimal' | 'normal' | 'outOfRange';

export function getStatusType(status: string): StatusType {
  if (status === 'optimal' || status === 'good') return 'optimal';
  if (status === 'outOfRange' || status === 'high' || status === 'low') return 'outOfRange';
  return 'normal';
}

/**
 * Status class type
 */
export interface StatusClasses {
  bg: string;
  text: string;
  border: string;
  dot: string;
  badge: string;
}

/**
 * Get Tailwind classes for a status
 */
export function getStatusClasses(status: StatusType): StatusClasses {
  return STATUS_CLASSES[status];
}
