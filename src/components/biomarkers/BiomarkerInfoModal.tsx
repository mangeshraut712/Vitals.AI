'use client';

import { useEffect, useCallback } from 'react';
import { BiomarkerRangeGraph } from './BiomarkerRangeGraph';
import { BIOMARKER_REFERENCES, type BiomarkerReference } from '@/lib/biomarkers/reference';
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
    return `${range.min} - ${range.max}`;
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
      return 'Your value is in the optimal range, indicating excellent health in this area.';
    case 'normal':
      return 'Your value is within the standard reference range but could be optimized.';
    case 'borderline':
      return 'Your value is approaching the edge of the normal range. Consider monitoring.';
    case 'out_of_range':
      return 'Your value is outside the standard reference range. Consider consulting a healthcare provider.';
  }
}

export function BiomarkerInfoModal({
  biomarkerId,
  name,
  value,
  unit,
  status,
  category,
  onClose,
}: BiomarkerInfoModalProps): React.JSX.Element {
  // Get reference data for this biomarker
  const reference: BiomarkerReference | undefined = BIOMARKER_REFERENCES[biomarkerId];

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [handleKeyDown]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent): void => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const statusColors = {
    optimal: 'text-emerald-600 bg-emerald-50',
    normal: 'text-amber-600 bg-amber-50',
    borderline: 'text-orange-600 bg-orange-50',
    out_of_range: 'text-rose-600 bg-rose-50',
  };

  const statusLabels = {
    optimal: 'Optimal',
    normal: 'Normal',
    borderline: 'Borderline',
    out_of_range: 'Out of Range',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-8 py-6 rounded-t-3xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">
                {category}
              </p>
              <h2 id="modal-title" className="text-2xl font-semibold text-slate-900">
                {name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 -mt-2 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-8">
          {/* Range Graph */}
          <div className="bg-slate-50 rounded-2xl p-6">
            <BiomarkerRangeGraph
              value={value}
              unit={unit}
              standardRange={reference?.standardRange}
              optimalRange={reference?.optimalRange}
              direction={reference?.direction}
            />
          </div>

          {/* Current Value & Optimal Range - Two Columns */}
          <div className="grid grid-cols-2 gap-6">
            {/* Current Value */}
            <div className="bg-slate-50 rounded-2xl p-6">
              <p className="text-sm font-medium text-slate-500 mb-2">Your Value</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">{value}</span>
                <span className="text-lg text-slate-500">{unit}</span>
              </div>
              <div className="mt-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[status]}`}
                >
                  {statusLabels[status]}
                </span>
              </div>
            </div>

            {/* Optimal Range */}
            <div className="bg-emerald-50 rounded-2xl p-6">
              <p className="text-sm font-medium text-emerald-700 mb-2">Optimal Range</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-emerald-700">
                  {formatRange(reference?.optimalRange)}
                </span>
                <span className="text-lg text-emerald-600">{unit}</span>
              </div>
              {reference?.standardRange && (
                <div className="mt-3">
                  <p className="text-sm text-emerald-600">
                    Standard: {formatRange(reference.standardRange)} {unit}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Status Summary */}
          <div className={`rounded-2xl p-6 ${statusColors[status].replace('text-', 'border-').split(' ')[0]} border-2 bg-white`}>
            <p className="text-slate-700">{getStatusDescription(status)}</p>
          </div>

          {/* Information Sections */}
          <div className="space-y-6">
            {/* What is this biomarker? */}
            <InfoSection
              title={`What is ${name}?`}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            >
              <p className="text-slate-600 leading-relaxed">
                {/* Scaffolded content - to be populated with actual biomarker descriptions */}
                Information about what {name} measures and its role in your body will appear here.
                This section will explain the biological function and clinical significance of this
                biomarker.
              </p>
              {reference?.isCalculated && reference.formula && (
                <div className="mt-4 p-4 bg-slate-100 rounded-xl">
                  <p className="text-sm font-medium text-slate-700 mb-1">Formula</p>
                  <code className="text-sm text-slate-600">{reference.formula}</code>
                </div>
              )}
            </InfoSection>

            {/* What influences this biomarker? */}
            <InfoSection
              title={`What Influences ${name}?`}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                  />
                </svg>
              }
            >
              <p className="text-slate-600 leading-relaxed">
                {/* Scaffolded content - to be populated with factors that affect this biomarker */}
                Factors that can affect your {name} levels will be listed here, including:
              </p>
              <ul className="mt-3 space-y-2">
                <li className="flex items-start gap-3 text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
                  <span>Diet and nutrition factors</span>
                </li>
                <li className="flex items-start gap-3 text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
                  <span>Lifestyle and exercise habits</span>
                </li>
                <li className="flex items-start gap-3 text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
                  <span>Medications and supplements</span>
                </li>
                <li className="flex items-start gap-3 text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
                  <span>Underlying health conditions</span>
                </li>
              </ul>
            </InfoSection>

            {/* What does it mean for you? */}
            <InfoSection
              title={`What Does ${name} Mean for You?`}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              }
            >
              <p className="text-slate-600 leading-relaxed">
                {/* Scaffolded content - personalized interpretation based on value */}
                Based on your current value of{' '}
                <span className="font-semibold text-slate-900">
                  {value} {unit}
                </span>
                , here&apos;s what you should know:
              </p>
              <div className="mt-4 p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
                <p className="text-slate-600 leading-relaxed">
                  {getStatusDescription(status)} Personalized recommendations and insights based on
                  your specific results will appear here.
                </p>
              </div>
            </InfoSection>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-100 px-8 py-4 rounded-b-3xl">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {reference?.isCalculated ? 'Calculated value' : 'Lab result'}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface InfoSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function InfoSection({ title, icon, children }: InfoSectionProps): React.JSX.Element {
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 border-b border-slate-200">
        <span className="text-slate-600">{icon}</span>
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}
