'use client';

import { useCallback, useEffect, useState } from 'react';
import { loggers } from '@/lib/logger';

interface ServiceWorkerHook {
    isRegistered: boolean;
    isUpdateAvailable: boolean;
    registration: ServiceWorkerRegistration | null;
    update: () => void;
}

export function useServiceWorker(): ServiceWorkerHook {
    const [isRegistered, setIsRegistered] = useState(false);
    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
            return;
        }

        let updateInterval: number | undefined;

        const registerServiceWorker = async () => {
            try {
                const reg = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/',
                });

                setRegistration(reg);
                setIsRegistered(true);

                loggers.pwa.info('Service worker registered', reg.scope);

                // Check for updates
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            setIsUpdateAvailable(true);
                            loggers.pwa.info('Service worker update available');
                        }
                    });
                });

                // Check for updates periodically
                updateInterval = window.setInterval(() => {
                    void reg.update();
                }, 60 * 60 * 1000); // Check every hour

            } catch (error) {
                loggers.pwa.error('Service worker registration failed', error);
            }
        };

        void registerServiceWorker();

        // Handle controller change (update installed)
        const handleControllerChange = () => {
            window.location.reload();
        };
        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

        return () => {
            if (updateInterval) {
                window.clearInterval(updateInterval);
            }
            navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        };
    }, []);

    const update = useCallback(() => {
        if (registration?.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
    }, [registration]);

    return { isRegistered, isUpdateAvailable, registration, update };
}

// Hook for PWA install prompt
export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    // Check if already installed at initialization
    const [isInstalled, setIsInstalled] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(display-mode: standalone)').matches;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Already installed check was done in initial state
        if (isInstalled) return;

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsInstallable(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, [isInstalled]);

    const install = async () => {
        if (!deferredPrompt) return false;

        // Show the install prompt
        (deferredPrompt as BeforeInstallPromptEvent).prompt();

        // Wait for the user's response
        const { outcome } = await (deferredPrompt as BeforeInstallPromptEvent).userChoice;

        setDeferredPrompt(null);
        setIsInstallable(false);

        return outcome === 'accepted';
    };

    return { isInstallable, isInstalled, install };
}

// Type for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
