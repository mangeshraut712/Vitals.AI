import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              HealthAI Dashboard
            </h1>
            <button className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
              Sync Data
            </button>
          </div>

          {/* Age Display */}
          <div className="flex flex-wrap gap-6 text-lg">
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">
                Chronological Age:{' '}
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                -- years
              </span>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">
                Biological Age:{' '}
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                -- years
              </span>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Delta: </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                --
              </span>
            </div>
          </div>
        </header>

        {/* 3-Column Grid for Health Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Blood Work Card */}
          <Card>
            <CardHeader>
              <CardTitle>Blood Work</CardTitle>
              <CardDescription>Lab results and biomarkers</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-500 dark:text-zinc-400">
                No data loaded
              </p>
            </CardContent>
          </Card>

          {/* DEXA Card */}
          <Card>
            <CardHeader>
              <CardTitle>DEXA Scan</CardTitle>
              <CardDescription>Body composition analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-500 dark:text-zinc-400">
                No data loaded
              </p>
            </CardContent>
          </Card>

          {/* Activity Card */}
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <CardDescription>HRV, sleep, and recovery</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-500 dark:text-zinc-400">
                No data loaded
              </p>
            </CardContent>
          </Card>
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
            <p className="text-zinc-500 dark:text-zinc-400">
              Load your health data to see personalized recommendations
            </p>
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
            <div className="h-48 flex items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg">
              <p className="text-zinc-500 dark:text-zinc-400">
                Chat interface placeholder
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
