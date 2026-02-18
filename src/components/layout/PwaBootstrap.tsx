'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { loggers } from '@/lib/logger';

export function PwaBootstrap(): null {
  const { isUpdateAvailable, update } = useServiceWorker();

  useEffect(() => {
    if (!isUpdateAvailable) return;

    loggers.pwa.info('Prompting user to refresh for service worker update');
    toast('Update available', {
      description: 'A new version of Vitals.AI is ready.',
      duration: 10000,
      action: {
        label: 'Refresh',
        onClick: update,
      },
    });
  }, [isUpdateAvailable, update]);

  return null;
}
