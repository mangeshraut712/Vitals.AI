'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { loggers } from '@/lib/logger';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        this.setState({ errorInfo });
        // Log error to monitoring service
        loggers.vitals.error('ErrorBoundary caught error', error, errorInfo);
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        this.props.onReset?.();
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
                    <p className="text-gray-400 mb-4 max-w-md">
                        An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
                    </p>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <pre className="text-xs text-red-400 bg-red-500/10 p-4 rounded-lg mb-4 max-w-lg overflow-auto">
                            {this.state.error.message}
                            {this.state.errorInfo?.componentStack}
                        </pre>
                    )}
                    <button
                        onClick={this.handleReset}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

// Specialized error boundaries for different sections
export function ChartErrorBoundary({ children }: { children: ReactNode }): ReactNode {
    return (
        <ErrorBoundary
            fallback={
                <div className="flex items-center justify-center h-[300px] bg-gray-800/50 rounded-lg">
                    <div className="text-center">
                        <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                        <p className="text-gray-400">Failed to load chart</p>
                    </div>
                </div>
            }
        >
            {children}
        </ErrorBoundary>
    );
}

export function DigitalTwinErrorBoundary({ children }: { children: ReactNode }): ReactNode {
    return (
        <ErrorBoundary
            fallback={
                <div className="flex items-center justify-center h-[500px] bg-gray-800/50 rounded-lg">
                    <div className="text-center">
                        <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                        <p className="text-gray-400">Failed to load 3D model</p>
                        <p className="text-gray-500 text-sm mt-1">Please check your browser supports WebGL</p>
                    </div>
                </div>
            }
        >
            {children}
        </ErrorBoundary>
    );
}

export function DataErrorBoundary({ children }: { children: ReactNode }): ReactNode {
    return (
        <ErrorBoundary
            fallback={
                <div className="flex items-center justify-center p-8 bg-gray-800/50 rounded-lg">
                    <div className="text-center">
                        <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                        <p className="text-gray-400">Failed to load data</p>
                        <p className="text-gray-500 text-sm mt-1">Please try refreshing the page</p>
                    </div>
                </div>
            }
        >
            {children}
        </ErrorBoundary>
    );
}
