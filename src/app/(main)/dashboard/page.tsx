import Link from 'next/link';
import { HealthDataStore } from '@/lib/store/health-data';
import { generateGoals } from '@/lib/analysis/goals';
import { generateContextualPills } from '@/lib/ai-chat/generateContextualPills';
import { selectTopMarkers } from '@/lib/biomarkers/selectTopMarkers';
import { calculateWeeklySummary } from '@/lib/lifestyle/calculateWeeklySummary';
import { UnifiedHealthCard } from '@/components/dashboard/UnifiedHealthCard';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { SyncButton } from '@/components/SyncButton';
// Dynamic import wrapper for heavy 3D component - reduces initial bundle by ~300KB (Rule 2.4)
import { DigitalTwinLoader } from '@/components/digital-twin/DigitalTwinLoader';
import { DataFreshnessBar } from '@/components/dashboard/DataFreshnessBar';
import { ChatProvider } from '@/lib/ai-chat/ChatContext';
import { AIChatWidget } from '@/components/ai-chat/AIChatWidget';
import { type StatusType, SPACING } from '@/lib/design/tokens';
import { readCache } from '@/lib/cache/biomarker-cache';
import { getBiomarkerStatus, BIOMARKER_REFERENCES } from '@/lib/biomarkers';

function getStatStatus(value: number | null, type: 'hrv' | 'sleepConsistency' | 'recovery' | 'steps'): StatusType {
  if (value === null) return 'normal';

  switch (type) {
    case 'hrv':
      return value >= 50 ? 'optimal' : value >= 30 ? 'normal' : 'outOfRange';
    case 'sleepConsistency':
      return value >= 80 ? 'optimal' : value >= 60 ? 'normal' : 'outOfRange';
    case 'recovery':
      return value >= 80 ? 'optimal' : value >= 60 ? 'normal' : 'outOfRange';
    case 'steps':
      return value >= 10000 ? 'optimal' : value >= 7000 ? 'normal' : 'outOfRange';
    default:
      return 'normal';
  }
}

// Get biomarker counts from cache (consistent with biomarkers page)
function getBiomarkerCountsFromCache(): { optimal: number; normal: number; outOfRange: number } {
  const cache = readCache();
  if (!cache || cache.biomarkers.length === 0) {
    return { optimal: 0, normal: 0, outOfRange: 0 };
  }

  let optimal = 0;
  let normal = 0;
  let outOfRange = 0;

  for (const marker of cache.biomarkers) {
    const ref = BIOMARKER_REFERENCES[marker.id];

    let statusType: StatusType;
    if (ref) {
      const calcStatus = getBiomarkerStatus(marker.id, marker.value);
      statusType = calcStatus === 'optimal' ? 'optimal' : calcStatus === 'out_of_range' ? 'outOfRange' : 'normal';
    } else if (marker.labStatus) {
      statusType = marker.labStatus === 'normal' ? 'normal' : 'outOfRange';
    } else {
      statusType = 'normal';
    }

    if (statusType === 'optimal') optimal++;
    else if (statusType === 'outOfRange') outOfRange++;
    else normal++;
  }

  return { optimal, normal, outOfRange };
}

export default async function DashboardPage(): Promise<React.JSX.Element> {
  // Load health data on server side - parallel fetching for performance (Rule 1.4)
  const [biomarkers, bodyComp, activity, phenoAge, chronoAge, timestamps] =
    await Promise.all([
      HealthDataStore.getBiomarkers(),
      HealthDataStore.getBodyComp(),
      HealthDataStore.getActivity(),
      HealthDataStore.getPhenoAge(),
      HealthDataStore.getChronologicalAge(),
      HealthDataStore.getTimestamps(),
    ]);

  // Generate goals
  const goals = generateGoals(biomarkers, phenoAge, bodyComp);

  // Generate contextual pills for AI chat
  const contextualPills = generateContextualPills(biomarkers);

  // Select top 5 markers to watch
  const topMarkers = selectTopMarkers(biomarkers);

  // Calculate weekly lifestyle summary
  const weeklySummary = calculateWeeklySummary(activity);

  // Build stats array: HRV, Sleep Consistency, Recovery %, Steps
  const stats = [
    {
      label: 'HRV',
      value: weeklySummary?.hrv ?? '--',
      unit: 'ms',
      status: getStatStatus(weeklySummary?.hrv ?? null, 'hrv'),
    },
    {
      label: 'Sleep',
      value: weeklySummary !== null && weeklySummary.sleepConsistency !== null
        ? `${weeklySummary.sleepConsistency}`
        : '--',
      unit: '% consistent',
      status: getStatStatus(weeklySummary?.sleepConsistency ?? null, 'sleepConsistency'),
    },
    {
      label: 'Recovery',
      value: weeklySummary !== null && weeklySummary.recovery !== null
        ? `${weeklySummary.recovery}`
        : '--',
      unit: '%',
      status: getStatStatus(weeklySummary?.recovery ?? null, 'recovery'),
    },
    {
      label: 'Steps',
      value: weeklySummary !== null && weeklySummary.steps !== null
        ? weeklySummary.steps.toLocaleString()
        : '--',
      unit: '/day',
      status: getStatStatus(weeklySummary?.steps ?? null, 'steps'),
    },
  ];

  return (
    <ChatProvider>
      <div className="max-w-6xl mx-auto px-6 py-8" style={{ gap: SPACING.lg }}>
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Your health at a glance</p>
          </div>
          <SyncButton />
        </header>

        {/* AI Chat Bar */}
        <div className="mb-4">
          <AIChatWidget contextualPills={contextualPills} />
        </div>

        {/* Data Freshness Bar */}
        <div className="mb-6 -mx-6 px-6">
          <DataFreshnessBar timestamps={timestamps} />
        </div>

        {/* Unified Health Card - Bio Age + Health Score + Action Items */}
        <div className="mb-8">
          <UnifiedHealthCard
            chronologicalAge={chronoAge}
            phenoAge={phenoAge}
            lifestyleMetrics={{
              hrv: weeklySummary?.hrv ?? null,
              steps: weeklySummary?.steps ?? null,
              sleepHours: weeklySummary?.sleepHours ?? null,
              recovery: weeklySummary?.recovery ?? null,
            }}
            bodyCompMetrics={{
              bodyFatPercent: bodyComp?.bodyFatPercent ?? null,
              muscleMass: bodyComp?.leanMass ?? null,
            }}
            goals={goals}
          />
        </div>

        {/* Main Grid Layout - Digital Twin + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Digital Twin */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
              Digital Twin
            </h3>
            <div className="h-[400px]">
              <DigitalTwinLoader
                className="w-full h-full"
                healthData={{ biomarkers, bodyComp, activity }}
              />
            </div>
          </div>

          {/* Stats Grid with integrated markers */}
          <div>
            <StatsGrid
              stats={stats}
              biomarkerCounts={getBiomarkerCountsFromCache()}
              topMarkers={topMarkers}
            />
          </div>
        </div>

        {/* Footer links */}
        <div className="pt-6 border-t border-gray-200">
          <div className="flex flex-wrap gap-6 text-sm">
            <Link
              href="/biomarkers"
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              Biomarkers
            </Link>
            <Link
              href="/body-comp"
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              Body Composition
            </Link>
            <Link
              href="/lifestyle"
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              Lifestyle
            </Link>
            <Link
              href="/data-sources"
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              Data Sources
            </Link>
          </div>
        </div>
      </div>
    </ChatProvider>
  );
}
