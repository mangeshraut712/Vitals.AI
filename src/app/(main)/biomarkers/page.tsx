import { readCache, type CachedBiomarker } from '@/lib/cache/biomarker-cache';
import { BIOMARKER_REFERENCES, getBiomarkerStatus } from '@/lib/biomarkers';
import { BiomarkersClient, type BiomarkerData } from './BiomarkersClient';
import { type CategoryFilter } from '@/components/biomarkers/BiomarkerFilters';
import type { StatusType } from '@/lib/design/tokens';
import type { BiomarkerStatus } from '@/lib/types/health';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Biomarkers',
  description: 'View and analyze your blood biomarker results with AI-powered insights and reference ranges.',
};

// Map status to display type
function mapStatusToType(status: ReturnType<typeof getBiomarkerStatus>): StatusType {
  if (status === 'optimal') return 'optimal';
  if (status === 'out_of_range') return 'outOfRange';
  return 'normal';
}

// Map category to filter
function mapCategoryToFilter(category?: string): CategoryFilter {
  if (!category) return 'other';
  const lower = category.toLowerCase();

  if (lower.includes('lipid')) return 'lipids';
  if (lower.includes('metabolic') || lower.includes('insulin') || lower.includes('liver') || lower.includes('kidney')) return 'metabolic';
  if (lower.includes('thyroid')) return 'thyroid';
  if (lower === 'calculated') return 'other';

  return 'other';
}

// Parse reference range string
function parseReferenceRange(range?: string): { min?: number; max?: number } | undefined {
  if (!range) return undefined;
  const rangeMatch = range.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
  if (rangeMatch) {
    return { min: parseFloat(rangeMatch[1]), max: parseFloat(rangeMatch[2]) };
  }
  const greaterMatch = range.match(/>\s*(\d+\.?\d*)/);
  if (greaterMatch) {
    return { min: parseFloat(greaterMatch[1]) };
  }
  const lessMatch = range.match(/<\s*(\d+\.?\d*)/);
  if (lessMatch) {
    return { max: parseFloat(lessMatch[1]) };
  }
  return undefined;
}

function getBiomarkerData(): BiomarkerData {
  const cache = readCache();

  if (!cache || cache.biomarkers.length === 0) {
    return {
      rows: [],
      counts: { total: 0, optimal: 0, normal: 0, outOfRange: 0 },
    };
  }

  let optimal = 0;
  let normal = 0;
  let outOfRange = 0;

  const rows = cache.biomarkers.map((marker: CachedBiomarker) => {
    // Get reference for this biomarker
    const ref = BIOMARKER_REFERENCES[marker.id];

    // Determine status using our rules
    let status: BiomarkerStatus;
    let statusType: StatusType;

    if (ref) {
      const calcStatus = getBiomarkerStatus(marker.id, marker.value);
      status = calcStatus === 'borderline' ? 'normal' : calcStatus;
      statusType = mapStatusToType(calcStatus);
    } else if (marker.labStatus) {
      // Fall back to lab's H/L flag
      status = marker.labStatus === 'normal' ? 'normal' : 'out_of_range';
      statusType = marker.labStatus === 'normal' ? 'normal' : 'outOfRange';
    } else {
      status = 'normal';
      statusType = 'normal';
    }

    // Count statuses
    if (statusType === 'optimal') optimal++;
    else if (statusType === 'outOfRange') outOfRange++;
    else normal++;

    return {
      key: marker.id,
      name: marker.name,
      value: marker.value,
      unit: marker.unit,
      status,
      statusType,
      category: mapCategoryToFilter(ref?.category ?? marker.category),
      history: [marker.value],
      optimalRange: ref?.optimalRange ?? parseReferenceRange(marker.referenceRange),
      isCalculated: marker.source === 'calculated',
    };
  });

  // Sort: out of range first, then alphabetically
  rows.sort((a, b) => {
    if (a.statusType === 'outOfRange' && b.statusType !== 'outOfRange') return -1;
    if (b.statusType === 'outOfRange' && a.statusType !== 'outOfRange') return 1;
    return a.name.localeCompare(b.name);
  });

  return {
    rows,
    counts: { total: cache.biomarkers.length, optimal, normal, outOfRange },
  };
}

export default function BiomarkersPage(): React.JSX.Element {
  const data = getBiomarkerData();
  const hasData = data.counts.total > 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <header className="vitals-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Biomarkers</h1>
        <p className="text-muted-foreground mt-1">
          {hasData
            ? `Tracking ${data.counts.total} biomarkers from your lab results`
            : 'No biomarkers synced yet. Go to Data Sources and click Sync Data.'}
        </p>
      </header>

      {hasData ? (
        <div className="vitals-fade-in vitals-fade-in-delay-1">
          <BiomarkersClient data={data} />
        </div>
      ) : (
        <div className="vitals-card p-8 text-center vitals-fade-in vitals-fade-in-delay-1">
          <svg
            className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Biomarkers Yet</h3>
          <p className="text-muted-foreground mb-4">
            Add a lab results PDF to the /data folder, then sync your data.
          </p>
          <a
            href="/data-sources"
            className="inline-flex items-center gap-2 px-4 py-2 vitals-gradient-bg text-white rounded-xl hover:opacity-90 transition-opacity font-medium"
          >
            Go to Data Sources
          </a>
        </div>
      )}
    </div>
  );
}
