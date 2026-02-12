'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Watch, Activity, Check } from 'lucide-react';

interface AddDeviceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnect: (deviceName: string, type: string) => void;
}

const AVAILABLE_DEVICES = [
    { name: 'Whoop 4.0', type: 'wearable', icon: Activity, color: 'bg-black' },
    { name: 'Eight Sleep Pod', type: 'sleep', icon: Smartphone, color: 'bg-indigo-600' },
    { name: 'Garmin Fenix 7', type: 'wearable', icon: Watch, color: 'bg-blue-600' },
    { name: 'Abbott Libre 3', type: 'cgm', icon: Activity, color: 'bg-orange-500' },
];

export default function AddDeviceModal({ isOpen, onClose, onConnect }: AddDeviceModalProps) {
    const [connecting, setConnecting] = useState<string | null>(null);

    const handleConnect = (deviceName: string, type: string) => {
        setConnecting(deviceName);
        // Simulate connection delay
        setTimeout(() => {
            onConnect(deviceName, type);
            setConnecting(null);
            onClose();
        }, 1500);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl z-50 p-6"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold tracking-tight text-foreground">
                                Add Data Source
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground"
                                disabled={!!connecting}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {AVAILABLE_DEVICES.map((device) => (
                                <button
                                    key={device.name}
                                    onClick={() => handleConnect(device.name, device.type)}
                                    disabled={!!connecting}
                                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-secondary/50 hover:bg-secondary border border-transparent hover:border-border transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2.5 rounded-xl ${device.color} text-white shadow-sm`}>
                                            <device.icon className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-medium text-foreground">{device.name}</div>
                                            <div className="text-xs text-muted-foreground capitalize">{device.type}</div>
                                        </div>
                                    </div>
                                    {connecting === device.name ? (
                                        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                            <Check className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        <p className="mt-6 text-center text-xs text-muted-foreground">
                            Powered by Terra API. Secure & Encrypted.
                        </p>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
