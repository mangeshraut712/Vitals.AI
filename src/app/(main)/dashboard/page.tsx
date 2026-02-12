import Link from 'next/link';
import { HealthDataStore } from '@/lib/store/health-data';
import { generateGoals } from '@/lib/analysis/goals';
import { generateContextualPills } from '@/lib/ai-chat/generateContextualPills';
import { selectTopMarkers } from '@/lib/biomarkers/selectTopMarkers';
import { calculateWeeklySummary } from '@/lib/lifestyle/calculateWeeklySummary';
import { UnifiedHealthCard } from '@/components/dashboard/UnifiedHealthCard';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { SyncButton } from '@/components/SyncButton';
// Dynamic import wrapper for heavy 3D component - reduces initial bundle by ~300KB
import { DigitalTwinLoader } from '@/components/digital-twin/DigitalTwinLoader';
import { HealthEventFeed } from '@/components/dashboard/HealthEventFeed';
import { ChatProvider } from '@/lib/ai-chat/ChatContext';
import { AIChatWidget } from '@/components/ai-chat/AIChatWidget';
import { DataFreshnessBar } from '@/components/dashboard/DataFreshnessBar';
import { type StatusType } from '@/lib/design/tokens';
import { readCache } from '@/lib/cache/biomarker-cache';
import { getBiomarkerStatus, BIOMARKER_REFERENCES } from '@/lib/biomarkers';

export const dynamic = 'force-dynamic';

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
  // Load health data on server side - parallel fetching for performance
  const [biomarkers, bodyComp, activity, phenoAge, chronoAge, events, timestamps] =
    await Promise.all([
      HealthDataStore.getBiomarkers(),
      HealthDataStore.getBodyComp(),
      HealthDataStore.getActivity(),
      HealthDataStore.getPhenoAge(),
      HealthDataStore.getChronologicalAge(),
      HealthDataStore.getHealthEvents({ limit: 8 }),
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
      <div className="container max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <header className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Your health at a glance</p>
            </div>
            <div className="flex items-center gap-3">
              <SyncButton />
            </div>
          </div>
          {/* Data Freshness Bar */}
          <div className="-mx-4 md:mx-0">
            <DataFreshnessBar timestamps={timestamps} />
          </div>
        </header>

        {/* AI Chat Bar */}
        <div className="w-full">
          <AIChatWidget contextualPills={contextualPills} />
        </div>

        {/* Unified Health Card - Bio Age + Health Score + Action Items */}
        <div className="w-full">
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Stats Grid - Takes up more space now */}
          <div className="lg:col-span-7 space-y-8">
            <StatsGrid
              stats={stats}
              biomarkerCounts={getBiomarkerCountsFromCache()}
              topMarkers={topMarkers}
            />
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Recent Events</h3>
              <HealthEventFeed events={events} />
            </div>
          </div>

          {/* Digital Twin - Side panel */}
          <div className="lg:col-span-5">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm h-full min-h-[500px] flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Digital Twin</h3>
                <span className="px-2 py-1 rounded-full bg-secondary text-xs font-medium text-secondary-foreground">Live Model</span>
              </div>
              <div className="flex-1 w-full bg-secondary/30 rounded-lg overflow-hidden relative">
                <DigitalTwinLoader
                  className="w-full h-full absolute inset-0"
                  healthData={{ biomarkers, bodyComp, activity }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer links - Restored for quick navigation */}
        <div className="pt-8 mt-8 border-t border-border">
          <div className="flex flex-wrap gap-6 text-sm font-medium">
            <Link
              href="/biomarkers"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Biomarkers
            </Link>
            <Link
              href="/body-comp"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Body Composition
            </Link>
            <Link
              href="/lifestyle"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Lifestyle
            </Link>
            <Link
              href="/data-sources"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Data Sources
            </Link>
            <Link
              href="/future"
              className="ml-auto text-primary hover:text-primary/80 transition-colors"
            >
              Vitals 2.0 (Beta) →
            </Link>
          </div>
        </div>
      </div>
    </ChatProvider>
  );
}
