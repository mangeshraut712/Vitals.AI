'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export function SyncButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async (): Promise<void> => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
      });

      const data = (await response.json()) as { success: boolean; message?: string; error?: string };

      if (data.success) {
        toast.success('Data synced successfully', {
          description: 'Your health data has been refreshed from the /data folder.',
        });
        window.location.reload();
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
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 transition-all duration-200 shadow-sm hover:shadow disabled:opacity-50"
    >
      <svg
        className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      {isLoading ? 'Syncing...' : 'Sync Data'}
    </button>
  );
}
