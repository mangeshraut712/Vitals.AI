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

function formatRange(range?: { min?: number; max?: number }, unit?: string): string {
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
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
    icon: '✓',
    glow: 'shadow-emerald-100',
  },
  normal: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700 ring-amber-600/20',
    icon: '~',
    glow: 'shadow-amber-100',
  },
  borderline: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-700 ring-orange-600/20',
    icon: '!',
    glow: 'shadow-orange-100',
  },
  out_of_range: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    badge: 'bg-rose-100 text-rose-700 ring-rose-600/20',
    icon: '✗',
    glow: 'shadow-rose-100',
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
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
        isVisible ? 'bg-black/50 backdrop-blur-sm' : 'bg-black/0'
      }`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-[2rem] shadow-2xl transition-all duration-300 ${
          isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        }`}
      >
        {/* Decorative header gradient */}
        <div className={`absolute top-0 left-0 right-0 h-32 ${config.bg} opacity-50`} />
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-white" />

        {/* Scrollable content */}
        <div className="relative max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 px-8 pt-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide uppercase bg-slate-100 text-slate-600">
                  {category}
                </span>
                <h2 id="modal-title" className="text-2xl font-bold text-slate-900 tracking-tight">
                  {name}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2.5 -mr-2 -mt-1 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors group"
                aria-label="Close modal"
              >
                <svg
                  className="w-5 h-5 text-slate-500 group-hover:text-slate-700 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 pb-8 space-y-6">
            {/* Range Graph Card */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-6 ring-1 ring-slate-200/50">
              <BiomarkerRangeGraph
                value={value}
                unit={unit}
                standardRange={reference?.standardRange}
                optimalRange={reference?.optimalRange}
                direction={reference?.direction}
              />
            </div>

            {/* Value Cards - Two Columns */}
            <div className="grid grid-cols-2 gap-4">
              {/* Your Value Card */}
              <div className={`relative overflow-hidden rounded-2xl p-5 ${config.bg} ring-1 ${config.border} ${config.glow} shadow-lg`}>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm font-medium ${config.text} opacity-80`}>Your Value</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${config.badge}`}>
                      {statusLabels[status]}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-4xl font-bold tracking-tight ${config.text}`}>{value}</span>
                    <span className={`text-lg font-medium ${config.text} opacity-70`}>{unit}</span>
                  </div>
                </div>
                {/* Decorative circle */}
                <div className={`absolute -bottom-8 -right-8 w-32 h-32 rounded-full ${config.bg} opacity-50`} />
              </div>

              {/* Optimal Range Card */}
              <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-emerald-50 to-teal-50 ring-1 ring-emerald-200 shadow-lg shadow-emerald-100">
                <div className="relative z-10">
                  <span className="text-sm font-medium text-emerald-700 opacity-80">Optimal Range</span>
                  <div className="flex items-baseline gap-1.5 mt-3">
                    <span className="text-4xl font-bold tracking-tight text-emerald-700">
                      {formatRange(reference?.optimalRange)}
                    </span>
                    <span className="text-lg font-medium text-emerald-600 opacity-70">{unit}</span>
                  </div>
                  {reference?.standardRange && (
                    <p className="text-sm text-emerald-600/80 mt-2">
                      Standard: {formatRange(reference.standardRange)} {unit}
                    </p>
                  )}
                </div>
                {/* Decorative circle */}
                <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-emerald-100/50" />
              </div>
            </div>

            {/* Information Sections */}
            <div className="space-y-4">
              <InfoSection
                title={`What is ${name}?`}
                emoji="🔬"
              >
                <p className="text-slate-600 leading-relaxed">
                  Information about what {name} measures and its role in your body will appear here.
                  This section explains the biological function and clinical significance.
                </p>
                {reference?.isCalculated && reference.formula && (
                  <div className="mt-4 p-4 bg-slate-100 rounded-xl font-mono text-sm">
                    <span className="text-slate-500">Formula: </span>
                    <span className="text-slate-700">{reference.formula}</span>
                  </div>
                )}
              </InfoSection>

              <InfoSection
                title={`What Influences ${name}?`}
                emoji="📊"
              >
                <p className="text-slate-600 leading-relaxed mb-4">
                  Factors that affect your {name} levels:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {['Diet & nutrition', 'Exercise habits', 'Sleep quality', 'Stress levels', 'Medications', 'Genetics'].map((factor) => (
                    <div key={factor} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      {factor}
                    </div>
                  ))}
                </div>
              </InfoSection>

              <InfoSection
                title={`What Does This Mean for You?`}
                emoji="👤"
              >
                <p className="text-slate-600 leading-relaxed">
                  Based on your value of{' '}
                  <span className={`font-semibold ${config.text}`}>
                    {value} {unit}
                  </span>
                  :
                </p>
                <div className={`mt-4 p-4 rounded-xl ${config.bg} ${config.border} border`}>
                  <p className={`text-sm ${config.text}`}>
                    {getStatusDescription(status)} Personalized recommendations will appear here.
                  </p>
                </div>
              </InfoSection>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-100 px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                {reference?.isCalculated ? 'Calculated from other biomarkers' : 'Measured lab value'}
              </div>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-full text-sm font-semibold hover:bg-slate-800 active:scale-[0.98] transition-all shadow-lg shadow-slate-900/25"
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
  emoji: string;
  children: React.ReactNode;
}

function InfoSection({ title, emoji, children }: InfoSectionProps): React.JSX.Element {
  return (
    <details className="group rounded-2xl bg-slate-50 ring-1 ring-slate-200/50 overflow-hidden">
      <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-slate-100/80 transition-colors list-none">
        <span className="text-xl">{emoji}</span>
        <h3 className="flex-1 font-semibold text-slate-900">{title}</h3>
        <svg
          className="w-5 h-5 text-slate-400 transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="px-5 pb-5 pt-2">{children}</div>
    </details>
  );
}
