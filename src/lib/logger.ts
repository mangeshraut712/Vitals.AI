/**
 * Centralized logging utility for the application
 * Provides consistent logging with levels and module prefixes
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
    level: LogLevel;
    enabled: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const DEFAULT_CONFIG: LoggerConfig = {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    enabled: true,
};

class Logger {
    private module: string;
    private config: LoggerConfig;

    constructor(module: string, config: LoggerConfig = DEFAULT_CONFIG) {
        this.module = module;
        this.config = config;
    }

    private shouldLog(level: LogLevel): boolean {
        if (!this.config.enabled) return false;
        return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
    }

    private formatMessage(level: LogLevel, message: string): string {
        return `[${this.module}] ${message}`;
    }

    debug(message: string, ...args: unknown[]): void {
        if (this.shouldLog('debug')) {
            console.log(this.formatMessage('debug', message), ...args);
        }
    }

    info(message: string, ...args: unknown[]): void {
        if (this.shouldLog('info')) {
            console.log(this.formatMessage('info', message), ...args);
        }
    }

    warn(message: string, ...args: unknown[]): void {
        if (this.shouldLog('warn')) {
            console.warn(this.formatMessage('warn', message), ...args);
        }
    }

    error(message: string, ...args: unknown[]): void {
        if (this.shouldLog('error')) {
            console.error(this.formatMessage('error', message), ...args);
        }
    }
}

/**
 * Create a logger for a specific module
 */
export function createLogger(module: string): Logger {
    return new Logger(module);
}

// Pre-configured loggers for common modules
export const loggers = {
    vitals: createLogger('Vitals.AI'),
    cache: createLogger('Cache'),
    pwa: createLogger('PWA'),
    api: createLogger('API'),
    sync: createLogger('Sync'),
    agent: createLogger('Agent'),
    parser: createLogger('Parser'),
    security: createLogger('Security'),
};

export default Logger;
