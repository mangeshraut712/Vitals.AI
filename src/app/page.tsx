import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { HealthDataStore } from '@/lib/store/health-data';
import {
  BIOMARKER_REFERENCES,
  getBiomarkerStatus,
  getStatusColor,
  getStatusBgColor,
} from '@/lib/types/health';
import { getImprovements } from '@/lib/analysis/improvements';
import { Chat } from '@/components/Chat';
import { SyncButton } from '@/components/SyncButton';
import { DigitalTwin } from '@/components/digital-twin/DigitalTwin';

export default function Home() {
  // Load health data on server side
  const biomarkers = HealthDataStore.getBiomarkers();
  const bodyComp = HealthDataStore.getBodyComp();
  const activity = HealthDataStore.getActivity();
  const phenoAge = HealthDataStore.getPhenoAge();
  const chronoAge = HealthDataStore.getChronologicalAge();

  // Calculate activity averages
  const activityAvg =
    activity.length > 0
      ? {
          hrv:
            activity.reduce((sum, d) => sum + d.hrv, 0) / activity.length,
          rhr:
            activity.reduce((sum, d) => sum + d.rhr, 0) / activity.length,
          sleep:
            activity.reduce((sum, d) => sum + d.sleepHours, 0) /
            activity.length,
        }
      : null;

  // Format biomarkers for display (excluding patientAge)
  const biomarkerEntries = Object.entries(biomarkers)
    .filter(([key]) => key !== 'patientAge')
    .map(([key, value]) => {
      const ref = BIOMARKER_REFERENCES[key];
      const status = getBiomarkerStatus(key, value as number);
      return {
        key,
        name: ref?.displayName ?? key,
        value: value as number,
        unit: ref?.unit ?? '',
        status,
        colorClass: getStatusColor(status),
      };
    });

  // Body comp entries
  const bodyCompEntries = Object.entries(bodyComp).map(([key, value]) => {
    const ref = BIOMARKER_REFERENCES[key];
    const status = getBiomarkerStatus(key, value as number);
    return {
      key,
      name: ref?.displayName ?? formatKey(key),
      value: value as number,
      unit: ref?.unit ?? '',
      status,
      colorClass: getStatusColor(status),
    };
  });

  // Get improvements
  const improvements = getImprovements(biomarkers, bodyComp);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              HealthAI Dashboard
            </h1>
            <SyncButton />
          </div>

          {/* Age Display */}
          <div className="flex flex-wrap gap-6 text-lg">
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">
                Chronological Age:{' '}
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {chronoAge !== null ? `${chronoAge} years` : '--'}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">
                Biological Age:{' '}
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {phenoAge !== null ? `${phenoAge.phenoAge} years` : '--'}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Delta: </span>
              <span
                className={`font-semibold ${
                  phenoAge !== null
                    ? phenoAge.delta < 0
                      ? 'text-green-600 dark:text-green-400'
                      : phenoAge.delta > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-900 dark:text-zinc-100'
                }`}
              >
                {phenoAge !== null
                  ? `${phenoAge.delta >= 0 ? '+' : ''}${phenoAge.delta} years`
                  : '--'}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content: Digital Twin + Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Digital Twin - Left Side */}
          <Card className="lg:row-span-2">
            <CardHeader>
              <CardTitle>Digital Twin</CardTitle>
              <CardDescription>Visual representation of your health</CardDescription>
            </CardHeader>
            <CardContent>
              <DigitalTwin
                className="w-full min-h-[400px] aspect-[4/5]"
                healthData={{ biomarkers, bodyComp, activity }}
              />
            </CardContent>
          </Card>

          {/* Stats Cards - Right Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
          {/* Blood Work Card */}
          <Card>
            <CardHeader>
              <CardTitle>Blood Work</CardTitle>
              <CardDescription>Lab results and biomarkers</CardDescription>
            </CardHeader>
            <CardContent>
              {biomarkerEntries.length > 0 ? (
                <div className="space-y-2">
                  {biomarkerEntries.map(({ key, name, value, unit, colorClass }) => (
                    <div
                      key={key}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {name}
                      </span>
                      <span className={`font-medium ${colorClass}`}>
                        {value} {unit}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 dark:text-zinc-400">No data</p>
              )}
            </CardContent>
          </Card>

          {/* DEXA Card */}
          <Card>
            <CardHeader>
              <CardTitle>DEXA Scan</CardTitle>
              <CardDescription>Body composition analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {bodyCompEntries.length > 0 ? (
                <div className="space-y-2">
                  {bodyCompEntries.map(({ key, name, value, unit, colorClass }) => (
                    <div
                      key={key}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {name}
                      </span>
                      <span className={`font-medium ${colorClass}`}>
                        {value}
                        {unit && ` ${unit}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 dark:text-zinc-400">No data</p>
              )}
            </CardContent>
          </Card>

          {/* Activity Card */}
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <CardDescription>HRV, sleep, and recovery (7-day avg)</CardDescription>
            </CardHeader>
            <CardContent>
              {activityAvg ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      HRV
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {activityAvg.hrv.toFixed(1)} ms
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Resting HR
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {activityAvg.rhr.toFixed(1)} bpm
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Sleep
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {activityAvg.sleep.toFixed(1)} hrs
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-zinc-500 dark:text-zinc-400">No data</p>
              )}
            </CardContent>
          </Card>
          </div>
        </div>

        {/* Areas to Improve Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Areas to Improve</CardTitle>
            <CardDescription>
              Recommendations based on your health data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {improvements.length > 0 ? (
              <div className="space-y-4">
                {improvements.map((improvement) => (
                  <div
                    key={improvement.biomarker}
                    className={`p-4 rounded-lg ${getStatusBgColor(improvement.status)}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {improvement.displayName}
                        </span>
                        <span className={`ml-2 text-sm ${getStatusColor(improvement.status)}`}>
                          {improvement.currentValue} {improvement.unit}
                        </span>
                      </div>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        Target: {improvement.targetValue}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {improvement.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            ) : biomarkerEntries.length > 0 ? (
              <div className="text-center py-4">
                <p className="text-green-600 dark:text-green-400 font-medium">
                  All biomarkers are within optimal ranges!
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Keep up the great work maintaining your health.
                </p>
              </div>
            ) : (
              <p className="text-zinc-500 dark:text-zinc-400">
                Load your health data to see personalized recommendations
              </p>
            )}
          </CardContent>
        </Card>

        {/* Chat Section */}
        <Card>
          <CardHeader>
            <CardTitle>Health Assistant</CardTitle>
            <CardDescription>
              Ask questions about your health data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Chat />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}
