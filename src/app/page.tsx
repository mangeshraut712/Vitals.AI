import Link from 'next/link';
import { TopNav } from '@/components/layout/TopNav';
import { HealthDataStore, type ActivityData } from '@/lib/store/health-data';
import {
  BIOMARKER_REFERENCES,
  getBiomarkerStatus,
  getStatusBgColor,
  getStatusColor,
  type BiomarkerStatus,
} from '@/lib/types/health';
import { getImprovements } from '@/lib/analysis/improvements';
import { SyncButton } from '@/components/SyncButton';
import { DataFreshnessBar } from '@/components/dashboard/DataFreshnessBar';
import { UnifiedHealthCard } from '@/components/dashboard/UnifiedHealthCard';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { HealthEventFeed } from '@/components/dashboard/HealthEventFeed';
import { DigitalTwinLoader } from '@/components/digital-twin/DigitalTwinLoader';
import { ChatProvider } from '@/lib/ai-chat/ChatContext';
import { AIChatWidget } from '@/components/ai-chat/AIChatWidget';
import { generateGoals } from '@/lib/analysis/goals';
import { generateContextualPills } from '@/lib/ai-chat/generateContextualPills';
import { selectTopMarkers } from '@/lib/biomarkers/selectTopMarkers';
import { calculateWeeklySummary } from '@/lib/lifestyle/calculateWeeklySummary';
import { readCache } from '@/lib/cache/biomarker-cache';
import {
  BIOMARKER_REFERENCES as CANONICAL_BIOMARKER_REFERENCES,
  getBiomarkerStatus as getCanonicalBiomarkerStatus,
} from '@/lib/biomarkers';
import { type StatusType } from '@/lib/design/tokens';
import type { BodyComposition } from '@/lib/extractors/body-comp';
import type { ExtractedBiomarkers } from '@/lib/extractors/biomarkers';

const CORE_BLOODWORK_ORDER = [
  'ldl',
  'hba1c',
  'glucose',
  'crp',
  'triglycerides',
  'hdl',
  'vitaminD',
  'homocysteine',
  'ferritin',
  'tsh',
] as const;

const CORE_BODY_COMP_ORDER = [
  'bodyFatPercent',
  'visceralFat',
  'leanMass',
  'fatMass',
  'boneDensityTScore',
  'almi',
] as const;

interface DisplayRow {
  key: string;
  name: string;
  value: number;
  unit: string;
  status: BiomarkerStatus;
}

function getStatStatus(
  value: number | null,
  type: 'hrv' | 'sleepConsistency' | 'recovery' | 'steps'
): StatusType {
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

function getBiomarkerCounts(
  biomarkers: ExtractedBiomarkers
): { optimal: number; normal: number; outOfRange: number } {
  const cache = readCache();

  if (cache && cache.biomarkers.length > 0) {
    let optimal = 0;
    let normal = 0;
    let outOfRange = 0;

    for (const marker of cache.biomarkers) {
      const ref = CANONICAL_BIOMARKER_REFERENCES[marker.id];

      if (ref) {
        const status = getCanonicalBiomarkerStatus(marker.id, marker.value);
        if (status === 'optimal') {
          optimal++;
        } else if (status === 'out_of_range') {
          outOfRange++;
        } else {
          normal++;
        }
      } else if (marker.labStatus === 'normal') {
        normal++;
      } else {
        outOfRange++;
      }
    }

    return { optimal, normal, outOfRange };
  }

  let optimal = 0;
  let normal = 0;
  let outOfRange = 0;

  for (const [key, value] of Object.entries(biomarkers)) {
    if (key === 'patientAge' || key === 'all' || typeof value !== 'number') {
      continue;
    }

    const status = getBiomarkerStatus(key, value);
    if (status === 'optimal') {
      optimal++;
    } else if (status === 'out_of_range') {
      outOfRange++;
    } else {
      normal++;
    }
  }

  return { optimal, normal, outOfRange };
}

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

function formatMetricValue(value: number): string {
  if (Math.abs(value) >= 100 || Number.isInteger(value)) {
    return value.toFixed(0);
  }
  return value.toFixed(1);
}

function getBloodworkRows(biomarkers: ExtractedBiomarkers): DisplayRow[] {
  const statusOrder: Record<BiomarkerStatus, number> = {
    out_of_range: 0,
    borderline: 1,
    normal: 2,
    optimal: 3,
  };

  const rows = Object.entries(biomarkers)
    .filter(([key, value]) => key !== 'patientAge' && key !== 'all' && typeof value === 'number')
    .map(([key, value]) => {
      const ref = BIOMARKER_REFERENCES[key];
      const status = getBiomarkerStatus(key, value as number);
      const priority = CORE_BLOODWORK_ORDER.indexOf(
        key as (typeof CORE_BLOODWORK_ORDER)[number]
      );

      return {
        key,
        name: ref?.displayName ?? formatKey(key),
        value: value as number,
        unit: ref?.unit ?? '',
        status,
        priority: priority === -1 ? Number.MAX_SAFE_INTEGER : priority,
      };
    })
    .sort(
      (a, b) =>
        statusOrder[a.status] - statusOrder[b.status] ||
        a.priority - b.priority ||
        a.name.localeCompare(b.name)
    )
    .slice(0, 10);

  return rows.map((row) => ({
    key: row.key,
    name: row.name,
    value: row.value,
    unit: row.unit,
    status: row.status,
  }));
}

function getBodyCompRows(bodyComp: BodyComposition): DisplayRow[] {
  const statusOrder: Record<BiomarkerStatus, number> = {
    out_of_range: 0,
    borderline: 1,
    normal: 2,
    optimal: 3,
  };

  const rows = Object.entries(bodyComp)
    .filter(([, value]) => typeof value === 'number')
    .map(([key, value]) => {
      const ref = BIOMARKER_REFERENCES[key];
      const status = getBiomarkerStatus(key, value as number);
      const priority = CORE_BODY_COMP_ORDER.indexOf(
        key as (typeof CORE_BODY_COMP_ORDER)[number]
      );

      return {
        key,
        name: ref?.displayName ?? formatKey(key),
        value: value as number,
        unit: ref?.unit ?? '',
        status,
        priority: priority === -1 ? Number.MAX_SAFE_INTEGER : priority,
      };
    })
    .sort(
      (a, b) =>
        a.priority - b.priority ||
        statusOrder[a.status] - statusOrder[b.status] ||
        a.name.localeCompare(b.name)
    )
    .slice(0, 8);

  return rows.map((row) => ({
    key: row.key,
    name: row.name,
    value: row.value,
    unit: row.unit,
    status: row.status,
  }));
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getActivitySummary(
  activity: ActivityData[],
  weeklySummary: ReturnType<typeof calculateWeeklySummary>
): Array<{ label: string; value: string; unit: string }> {
  const recent = activity.slice(-7);
  const averageRhr = average(recent.map((entry) => entry.rhr).filter((value) => value > 0));

  const hrv =
    weeklySummary?.hrv !== null && weeklySummary?.hrv !== undefined
      ? `${weeklySummary.hrv}`
      : '--';
  const rhr = averageRhr !== null ? averageRhr.toFixed(0) : '--';
  const sleep =
    weeklySummary?.sleepHours !== null && weeklySummary?.sleepHours !== undefined
      ? weeklySummary.sleepHours.toFixed(1)
      : '--';
  const recovery =
    weeklySummary?.recovery !== null && weeklySummary?.recovery !== undefined
      ? `${weeklySummary.recovery}`
      : '--';

  return [
    { label: 'HRV', value: hrv, unit: 'ms' },
    { label: 'Resting HR', value: rhr, unit: 'bpm' },
    { label: 'Sleep', value: sleep, unit: 'hrs' },
    { label: 'Recovery', value: recovery, unit: '%' },
  ];
}

function getDeltaClasses(delta: number | null): string {
  if (delta === null) {
    return 'text-foreground';
  }
  if (delta < 0) {
    return 'text-emerald-500';
  }
  if (delta > 0) {
    return 'text-rose-500';
  }
  return 'text-foreground';
}

interface CoreDataCardProps {
  title: string;
  description: string;
  href: string;
  hrefLabel: string;
  children: React.ReactNode;
}

function CoreDataCard({
  title,
  description,
  href,
  hrefLabel,
  children,
}: CoreDataCardProps): React.JSX.Element {
  return (
    <section className="vitals-card p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <Link
          href={href}
          className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          {hrefLabel} →
        </Link>
      </div>
      {children}
    </section>
  );
}

export default async function HomePage(): Promise<React.JSX.Element> {
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

  const weeklySummary = calculateWeeklySummary(activity);
  const goals = generateGoals(biomarkers, phenoAge, bodyComp);
  const contextualPills = generateContextualPills(biomarkers);
  const topMarkers = selectTopMarkers(biomarkers);
  const improvements = getImprovements(biomarkers, bodyComp).slice(0, 6);

  const bloodworkRows = getBloodworkRows(biomarkers);
  const bodyCompRows = getBodyCompRows(bodyComp);
  const activityRows = getActivitySummary(activity, weeklySummary);

  const stats = [
    {
      label: 'HRV',
      value: weeklySummary?.hrv ?? '--',
      unit: 'ms',
      status: getStatStatus(weeklySummary?.hrv ?? null, 'hrv'),
    },
    {
      label: 'Sleep',
      value:
        weeklySummary !== null && weeklySummary.sleepConsistency !== null
          ? `${weeklySummary.sleepConsistency}`
          : '--',
      unit: '% consistent',
      status: getStatStatus(weeklySummary?.sleepConsistency ?? null, 'sleepConsistency'),
    },
    {
      label: 'Recovery',
      value:
        weeklySummary !== null && weeklySummary.recovery !== null
          ? `${weeklySummary.recovery}`
          : '--',
      unit: '%',
      status: getStatStatus(weeklySummary?.recovery ?? null, 'recovery'),
    },
    {
      label: 'Steps',
      value:
        weeklySummary !== null && weeklySummary.steps !== null
          ? weeklySummary.steps.toLocaleString()
          : '--',
      unit: '/day',
      status: getStatStatus(weeklySummary?.steps ?? null, 'steps'),
    },
  ];

  const biologicalAge = phenoAge?.phenoAge ?? null;
  const ageDelta = phenoAge?.delta ?? null;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <TopNav />
      <main className="pt-20 pb-12">
        <ChatProvider>
          <div className="container max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
            <header className="vitals-card overflow-hidden vitals-fade-in">
              <div className="relative p-6 lg:p-8">
                <div
                  className="pointer-events-none absolute inset-0 opacity-50"
                  aria-hidden="true"
                >
                  <div className="absolute top-0 right-0 w-72 h-72 vitals-gradient-subtle rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 space-y-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Core Frontend Restored
                      </p>
                      <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                        Vitals.AI Home
                      </h1>
                      <p className="text-muted-foreground max-w-2xl">
                        Unified view of your biomarkers, body composition, lifestyle recovery, and
                        AI guidance.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href="/dashboard"
                        className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
                      >
                        Open Dashboard
                      </Link>
                      <SyncButton />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                        Chronological Age
                      </p>
                      <p className="text-2xl font-bold tabular-nums text-foreground">
                        {chronoAge !== null ? `${chronoAge}` : '--'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">years</p>
                    </div>

                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                        Biological Age
                      </p>
                      <p className="text-2xl font-bold tabular-nums text-foreground">
                        {biologicalAge !== null ? biologicalAge.toFixed(1) : '--'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">years</p>
                    </div>

                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                        Age Delta
                      </p>
                      <p
                        className={`text-2xl font-bold tabular-nums ${getDeltaClasses(ageDelta)}`}
                      >
                        {ageDelta !== null
                          ? `${ageDelta > 0 ? '+' : ''}${ageDelta.toFixed(1)}`
                          : '--'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">years vs calendar age</p>
                    </div>
                  </div>
                </div>
              </div>

              <DataFreshnessBar timestamps={timestamps} />
            </header>

            <section className="vitals-fade-in vitals-fade-in-delay-1">
              <AIChatWidget contextualPills={contextualPills} />
            </section>

            <section className="vitals-fade-in vitals-fade-in-delay-2">
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
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 vitals-fade-in vitals-fade-in-delay-3">
              <div className="lg:col-span-7 space-y-8">
                <StatsGrid
                  stats={stats}
                  biomarkerCounts={getBiomarkerCounts(biomarkers)}
                  topMarkers={topMarkers}
                />
                <HealthEventFeed events={events} />
              </div>

              <div className="lg:col-span-5">
                <div className="vitals-card p-6 h-full min-h-[500px] flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-foreground">Digital Twin</h2>
                    <span className="px-2 py-1 rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
                      Live Model
                    </span>
                  </div>

                  <div className="flex-1 w-full bg-secondary/30 rounded-lg overflow-hidden relative">
                    <DigitalTwinLoader
                      className="w-full h-full absolute inset-0"
                      healthData={{ biomarkers, bodyComp, activity }}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 vitals-fade-in vitals-fade-in-delay-4">
              <CoreDataCard
                title="Blood Work"
                description="Recovered core lab summary with priority marker ordering."
                href="/biomarkers"
                hrefLabel="View all"
              >
                {bloodworkRows.length > 0 ? (
                  <div className="space-y-2">
                    {bloodworkRows.map((row) => (
                      <div key={row.key} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{row.name}</span>
                        <span className={`font-semibold tabular-nums ${getStatusColor(row.status)}`}>
                          {formatMetricValue(row.value)} {row.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No blood work loaded. Add files in `/data` and sync.
                  </p>
                )}
              </CoreDataCard>

              <CoreDataCard
                title="DEXA Scan"
                description="Recovered body composition card from the original homepage."
                href="/body-comp"
                hrefLabel="Open body comp"
              >
                {bodyCompRows.length > 0 ? (
                  <div className="space-y-2">
                    {bodyCompRows.map((row) => (
                      <div key={row.key} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{row.name}</span>
                        <span className={`font-semibold tabular-nums ${getStatusColor(row.status)}`}>
                          {formatMetricValue(row.value)}{row.unit ? ` ${row.unit}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No DEXA data loaded. Add files in `/data` and sync.
                  </p>
                )}
              </CoreDataCard>

              <CoreDataCard
                title="Activity"
                description="7-day rolling summary of recovery and strain signals."
                href="/lifestyle"
                hrefLabel="Open lifestyle"
              >
                {activityRows.length > 0 ? (
                  <div className="space-y-2">
                    {activityRows.map((row) => (
                      <div key={row.label} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="font-semibold tabular-nums text-foreground">
                          {row.value} {row.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No activity data loaded. Connect a source in Data Sources.
                  </p>
                )}
              </CoreDataCard>
            </section>

            <section className="vitals-card p-6 md:p-7 vitals-fade-in vitals-fade-in-delay-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Areas to Improve</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Personalized priority recommendations recovered from the original core frontend.
                  </p>
                </div>
                <Link
                  href="/goals"
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Open full goals plan →
                </Link>
              </div>

              {improvements.length > 0 ? (
                <div className="space-y-3">
                  {improvements.map((improvement) => (
                    <article
                      key={improvement.biomarker}
                      className={`rounded-xl p-4 border border-border ${getStatusBgColor(improvement.status)}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">{improvement.displayName}</p>
                          <p className={`text-sm ${getStatusColor(improvement.status)}`}>
                            {formatMetricValue(improvement.currentValue)} {improvement.unit}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Target: {improvement.targetValue}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {improvement.recommendation}
                      </p>
                    </article>
                  ))}
                </div>
              ) : bloodworkRows.length > 0 ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                  <p className="font-semibold text-emerald-500">All key markers are in range.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Keep your current protocol and continue regular retesting.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sync data to generate personalized recommendations.
                </p>
              )}
            </section>

            <footer className="vitals-card p-5 vitals-fade-in vitals-fade-in-delay-6">
              <div className="flex flex-wrap gap-5 text-sm font-medium">
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
                  href="/tools/agent"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Agent Tools
                </Link>
                <Link
                  href="/future"
                  className="ml-auto text-primary hover:text-primary/80 transition-colors"
                >
                  Vitals 2.0 (Beta) →
                </Link>
              </div>
            </footer>
          </div>
        </ChatProvider>
      </main>

      <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-chart-2/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
