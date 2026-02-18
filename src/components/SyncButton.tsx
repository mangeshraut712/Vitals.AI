'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

export function SyncButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSync = async (): Promise<void> => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
      });

      const data = (await response.json()) as {
        success: boolean;
        message?: string;
        error?: string;
        openclawDispatch?: {
          attempted: boolean;
          delivered: boolean;
          reason?: string;
          forwardedCount?: number;
        };
      };

      if (data.success) {
        const openclawStatus = data.openclawDispatch
          ? data.openclawDispatch.delivered
            ? ` OpenClaw notified (${data.openclawDispatch.forwardedCount ?? 0} events).`
            : ` OpenClaw dispatch skipped (${data.openclawDispatch.reason ?? 'no reason'}).`
          : '';

        toast.success('Data synced successfully', {
          description: `Your health data has been refreshed from the /data folder.${openclawStatus}`,
        });
        router.refresh();
      } else {
        toast.error('Sync failed', {
          description: data.error ?? 'Unknown error occurred',
        });
      }
    } catch (error) {
      toast.error('Sync failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={isLoading}
      className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card hover:bg-accent border border-border text-sm font-medium text-foreground transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <RefreshCw
        className={`w-4 h-4 transition-transform duration-500 ${isLoading ? 'animate-spin' : 'group-hover:rotate-90'
          }`}
        strokeWidth={2}
      />
      <span>{isLoading ? 'Syncing...' : 'Sync Data'}</span>
    </button>
  );
}
