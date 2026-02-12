'use client';

import { useEffect, useCallback, useState } from 'react';
import { BiomarkerRangeGraph } from './BiomarkerRangeGraph';
import { getBiomarkerReference, type BiomarkerReference } from '@/lib/biomarkers/reference';
import { type BiomarkerStatus } from '@/lib/types/health';

export interface BiomarkerInfoModalProps {
  biomarkerId: string;
  name: string;
  value: number;
  unit: string;
  status: BiomarkerStatus;
  category: string;
  onClose: () => void;
}

function formatRange(range?: { min?: number; max?: number }): string {
  if (!range) return 'Not specified';
  if (range.min !== undefined && range.max !== undefined) {
    return `${range.min}–${range.max}`;
  }
  if (range.min !== undefined) {
    return `≥ ${range.min}`;
  }
  if (range.max !== undefined) {
    return `≤ ${range.max}`;
  }
  return 'Not specified';
}

function getStatusDescription(status: BiomarkerStatus): string {
  switch (status) {
    case 'optimal':
      return 'Excellent! Your value is in the optimal range for longevity and peak performance.';
    case 'normal':
      return 'Your value is within the standard reference range. There may be room for optimization.';
    case 'borderline':
      return 'Your value is near the edge of normal. Worth monitoring and discussing with your provider.';
    case 'out_of_range':
      return 'Your value is outside the reference range. Consider consulting a healthcare provider.';
  }
}

const statusConfig = {
  optimal: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    border: 'border-emerald-500/20',
    badge: 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20',
    icon: '✓',
    glow: 'shadow-emerald-500/20',
  },
  normal: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    border: 'border-amber-500/20',
    badge: 'bg-amber-500/10 text-amber-500 ring-amber-500/20',
    icon: '~',
    glow: 'shadow-amber-500/20',
  },
  borderline: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-500',
    border: 'border-orange-500/20',
    badge: 'bg-orange-500/10 text-orange-500 ring-orange-500/20',
    icon: '!',
    glow: 'shadow-orange-500/20',
  },
  out_of_range: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-500',
    border: 'border-rose-500/20',
    badge: 'bg-rose-500/10 text-rose-500 ring-rose-500/20',
    icon: '✗',
    glow: 'shadow-rose-500/20',
  },
};

const statusLabels = {
  optimal: 'Optimal',
  normal: 'Normal',
  borderline: 'Borderline',
  out_of_range: 'Out of Range',
};

export function BiomarkerInfoModal({
  biomarkerId,
  name,
  value,
  unit,
  status,
  category,
  onClose,
}: BiomarkerInfoModalProps): React.JSX.Element {
  const [isVisible, setIsVisible] = useState(false);
  const reference: BiomarkerReference | undefined = getBiomarkerReference(biomarkerId);
  const config = statusConfig[status];

  // Animate in on mount
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // Handle close with animation
  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  }, [onClose]);

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    },
    [handleClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [handleKeyDown]);

  const handleBackdropClick = (e: React.MouseEvent): void => {
    if (e.target === e.currentTarget) handleClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${isVisible ? 'bg-black/50 backdrop-blur-sm' : 'bg-black/0'
        }`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`relative w-full max-w-xl max-h-[90vh] overflow-hidden bg-card rounded-3xl shadow-2xl transition-all duration-300 ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
          }`}
      >
        {/* Scrollable content */}
        <div className="relative max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{category}</p>
                <h2 id="modal-title" className="text-xl font-semibold text-foreground">
                  {name}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 -mr-2 -mt-2 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <svg
                  className="w-5 h-5 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Range Graph */}
            <BiomarkerRangeGraph
              value={value}
              unit={unit}
              standardRange={reference?.standardRange}
              optimalRange={reference?.optimalRange}
              direction={reference?.direction}
            />

            {/* Value Cards - Two Columns */}
            <div className="grid grid-cols-2 gap-4">
              {/* Your Value Card */}
              <div className="rounded-2xl p-5 bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Your Value</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.badge}`}>
                    {statusLabels[status]}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">{value}</span>
                  <span className="text-sm font-medium text-muted-foreground">{unit}</span>
                </div>
              </div>

              {/* Optimal Range Card */}
              <div className="rounded-2xl p-5 bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-sm font-medium text-emerald-500">Optimal Range</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-bold text-emerald-500">
                    {formatRange(reference?.optimalRange)}
                  </span>
                  <span className="text-sm font-medium text-emerald-500/80">{unit}</span>
                </div>
                {reference?.standardRange && (
                  <p className="text-xs text-emerald-500/70 mt-2 font-medium">
                    Standard: {formatRange(reference.standardRange)} {unit}
                  </p>
                )}
              </div>
            </div>

            {/* Information Sections */}
            <div className="space-y-3">
              <InfoSection title={`What is ${name}?`}>
                <p className="text-muted-foreground leading-relaxed">
                  Information about what {name} measures and its role in your body will appear here.
                  This section explains the biological function and clinical significance.
                </p>
                {reference?.isCalculated && reference.formula && (
                  <div className="mt-3 p-3 bg-muted/30 border border-border/50 rounded-lg font-mono text-xs text-muted-foreground">
                    {reference.formula}
                  </div>
                )}
              </InfoSection>

              <InfoSection title={`What Influences ${name}?`}>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Factors that affect your {name} levels:
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {['Diet & nutrition', 'Exercise habits', 'Sleep quality', 'Stress levels', 'Medications', 'Genetics'].map((factor) => (
                    <div key={factor} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      {factor}
                    </div>
                  ))}
                </div>
              </InfoSection>

              <InfoSection title="What Does This Mean for You?">
                <p className="text-muted-foreground leading-relaxed">
                  Based on your value of{' '}
                  <span className="font-medium text-foreground">
                    {value} {unit}
                  </span>
                  , {getStatusDescription(status).toLowerCase()} Personalized recommendations will appear here.
                </p>
              </InfoSection>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {reference?.isCalculated ? 'Calculated' : 'Lab result'}
              </span>
              <button
                onClick={handleClose}
                className="px-5 py-2 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface InfoSectionProps {
  title: string;
  children: React.ReactNode;
}

function InfoSection({ title, children }: InfoSectionProps): React.JSX.Element {
  return (
    <details className="group border-b border-border last:border-0">
      <summary className="flex items-center justify-between py-4 cursor-pointer list-none">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <svg
          className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="pb-4 text-sm">{children}</div>
    </details>
  );
}
