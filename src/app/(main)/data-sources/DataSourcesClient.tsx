'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CARD_CLASSES, STATUS_COLORS } from '@/lib/design/tokens';
import type { DataSourceInfo } from './page';
import type { FileType } from '@/lib/files';

interface DataSourcesClientProps {
  dataSources: DataSourceInfo[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getFileTypeIcon(type: FileType): React.JSX.Element {
  const baseClasses = 'w-10 h-10 rounded-lg flex items-center justify-center';

  switch (type) {
    case 'bloodwork':
      return (
        <div className={`${baseClasses} bg-rose-500/10`}>
          <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
      );
    case 'dexa':
      return (
        <div className={`${baseClasses} bg-emerald-500/10`}>
          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      );
    case 'activity':
      return (
        <div className={`${baseClasses} bg-cyan-500/10`}>
          <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      );
    default:
      return (
        <div className={`${baseClasses} bg-muted`}>
          <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      );
  }
}

function getFileTypeLabel(type: FileType): string {
  switch (type) {
    case 'bloodwork': return 'Blood Work';
    case 'dexa': return 'DEXA Scan';
    case 'activity': return 'Activity';
    default: return 'Unknown';
  }
}

function getStatusBadge(status: DataSourceInfo['status']): React.JSX.Element {
  const statusConfig = {
    loaded: { bg: STATUS_COLORS.optimal.light, text: STATUS_COLORS.optimal.text, label: 'Loaded' },
    error: { bg: STATUS_COLORS.outOfRange.light, text: STATUS_COLORS.outOfRange.text, label: 'Error' },
    pending: { bg: STATUS_COLORS.normal.light, text: STATUS_COLORS.normal.text, label: 'Pending' },
  };

  const config = statusConfig[status];

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      {config.label}
    </span>
  );
}

export function DataSourcesClient({ dataSources }: DataSourcesClientProps): React.JSX.Element {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const router = useRouter();

  const handleSync = async (): Promise<void> => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch('/api/sync', { method: 'POST' });
      const data = await response.json() as { success: boolean; message?: string; error?: string; biomarkersExtracted?: number };

      if (data.success) {
        setSyncResult({
          success: true,
          message: `Synced ${data.biomarkersExtracted ?? 0} biomarkers`,
        });
        // Refresh after short delay so success state is visible.
        setTimeout(() => router.refresh(), 1000);
      } else {
        setSyncResult({
          success: false,
          message: data.error ?? 'Sync failed',
        });
      }
    } catch (error) {
      setSyncResult({
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions card */}
      <div className={`${CARD_CLASSES.base} ${CARD_CLASSES.padding} bg-secondary/20`}>
        <h3 className="font-medium text-foreground mb-2">Adding New Data</h3>
        <p className="text-sm text-muted-foreground mb-3">
          To add new health data, place files in the <code className="bg-muted px-1.5 py-0.5 rounded text-xs">/data</code> folder in the project directory.
        </p>
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Supported formats:</strong> .txt, .csv, .xlsx</p>
          <p><strong>File naming:</strong> Include keywords like &quot;blood&quot;, &quot;dexa&quot;, or &quot;whoop&quot; for auto-detection.</p>
        </div>
      </div>

      {/* Data sources list */}
      {dataSources.length === 0 ? (
        <div className={`${CARD_CLASSES.base} ${CARD_CLASSES.padding} text-center py-12`}>
          <svg className="w-12 h-12 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-foreground mb-2">No data files found</h3>
          <p className="text-muted-foreground">
            Add .txt, .csv, or .xlsx files to the <code className="bg-muted px-1.5 py-0.5 rounded text-xs">/data</code> folder to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {dataSources.map((source) => (
            <div
              key={source.name}
              className={`${CARD_CLASSES.base} ${CARD_CLASSES.hover} p-4`}
            >
              <div className="flex items-start gap-4">
                {getFileTypeIcon(source.type)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground truncate">{source.name}</h3>
                    {getStatusBadge(source.status)}
                  </div>

                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>{getFileTypeLabel(source.type)}</span>
                    <span>{formatFileSize(source.size)}</span>
                    <span>{formatDate(source.lastModified)}</span>
                  </div>

                  {source.extractedData && source.extractedData.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {source.extractedData.map((data, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded px-2 py-0.5 text-xs bg-muted text-muted-foreground"
                        >
                          {data}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sync button and status */}
      <div className="flex items-center justify-between">
        {syncResult && (
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
              syncResult.success
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'bg-rose-500/10 text-rose-500'
            }`}
          >
            {syncResult.success ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {syncResult.message}
          </div>
        )}
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition hover:opacity-90 disabled:opacity-50 vitals-gradient-bg"
        >
          <svg
            className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isSyncing ? 'Syncing...' : 'Sync Data'}
        </button>
      </div>
    </div>
  );
}
