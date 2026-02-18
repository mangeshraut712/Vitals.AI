/**
 * Security Utilities for Input Validation and Sanitization
 */

// ============================================
// Input Sanitization
// ============================================

/**
 * Sanitize string input to prevent XSS attacks
 */
export function sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';

    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
}

/**
 * Sanitize HTML content - remove dangerous tags and attributes
 */
export function sanitizeHtml(html: string): string {
    // Remove script tags
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove event handlers
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');

    // Remove javascript: URLs
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Remove data: URLs (can be used for XSS)
    sanitized = sanitized.replace(/data:/gi, '');

    return sanitized;
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
    // Remove path separators and null bytes
    return filename
        .replace(/[\/\\]/g, '_')
        .replace(/\0/g, '')
        .replace(/\.\./g, '')
        .replace(/[<>:"|?*]/g, '_')
        .trim();
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string | null {
    const sanitized = sanitizeString(email).toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(sanitized) ? sanitized : null;
}

/**
 * Sanitize URL to prevent SSRF and XSS
 */
export function sanitizeUrl(url: string): string | null {
    try {
        const parsed = new URL(url);

        // Only allow safe protocols
        const allowedProtocols = ['http:', 'https:'];
        if (!allowedProtocols.includes(parsed.protocol)) {
            return null;
        }

        // Block private IP ranges (basic check)
        const hostname = parsed.hostname;
        const privateIpPatterns = [
            /^127\./,
            /^10\./,
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
            /^192\.168\./,
            /^localhost$/i,
            /^0\.0\.0\.0$/,
        ];

        for (const pattern of privateIpPatterns) {
            if (pattern.test(hostname)) {
                return null;
            }
        }

        return parsed.toString();
    } catch {
        return null;
    }
}

// ============================================
// Rate Limiting (In-Memory)
// ============================================

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Simple in-memory rate limiter
 */
export function checkRateLimit(
    key: string,
    maxRequests: number = 100,
    windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
        // Create new entry
        const newEntry: RateLimitEntry = {
            count: 1,
            resetTime: now + windowMs,
        };
        rateLimitStore.set(key, newEntry);

        return {
            allowed: true,
            remaining: maxRequests - 1,
            resetTime: newEntry.resetTime,
        };
    }

    if (entry.count >= maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetTime: entry.resetTime,
        };
    }

    entry.count++;
    return {
        allowed: true,
        remaining: maxRequests - entry.count,
        resetTime: entry.resetTime,
    };
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimits(): void {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}

// ============================================
// Content Security Policy
// ============================================

/**
 * Generate CSP headers for Next.js
 */
export function generateCSP(): string {
    const policies = {
        'default-src': ["'self'"],
        'script-src': [
            "'self'",
            "'unsafe-inline'", // Required for Next.js
            "'unsafe-eval'", // Required for some libraries
            'https://cdn.jsdelivr.net',
        ],
        'style-src': [
            "'self'",
            "'unsafe-inline'", // Required for Tailwind
        ],
        'img-src': [
            "'self'",
            'data:',
            'blob:',
            'https:',
        ],
        'font-src': ["'self'"],
        'connect-src': [
            "'self'",
            'https://api.openai.com',
            'https://openrouter.ai',
        ],
        'frame-ancestors': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
    };

    return Object.entries(policies)
        .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
        .join('; ');
}

/**
 * Security headers for API routes
 */
export function getSecurityHeaders(): Record<string, string> {
    return {
        'Content-Security-Policy': generateCSP(),
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };
}

// ============================================
// Input Validation Helpers
// ============================================

/**
 * Validate numeric input
 */
export function validateNumber(
    input: unknown,
    min?: number,
    max?: number
): number | null {
    let value: number;

    if (typeof input === 'number' && !isNaN(input)) {
        value = input;
    } else if (typeof input === 'string' || typeof input === 'number') {
        const parsed = parseFloat(String(input));
        if (isNaN(parsed)) return null;
        value = parsed;
    } else {
        return null;
    }

    if (min !== undefined && value < min) return null;
    if (max !== undefined && value > max) return null;

    return value;
}

/**
 * Validate date input
 */
export function validateDate(input: unknown): Date | null {
    if (input instanceof Date && !isNaN(input.getTime())) {
        return input;
    }

    if (typeof input === 'string' || typeof input === 'number') {
        const date = new Date(input);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }

    return null;
}

/**
 * Validate enum value
 */
export function validateEnum<T extends string>(
    input: unknown,
    allowedValues: T[]
): T | null {
    if (typeof input !== 'string') return null;
    return allowedValues.includes(input as T) ? (input as T) : null;
}

/**
 * Validate array of strings
 */
export function validateStringArray(input: unknown): string[] | null {
    if (!Array.isArray(input)) return null;

    const result: string[] = [];
    for (const item of input) {
        if (typeof item === 'string') {
            result.push(sanitizeString(item));
        } else {
            return null;
        }
    }

    return result;
}

// ============================================
// CSRF Protection
// ============================================

/**
 * Generate CSRF token
 */
export function generateCsrfToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate CSRF token
 */
export function validateCsrfToken(token: string, expectedToken: string): boolean {
    if (!token || !expectedToken) return false;

    // Use timing-safe comparison
    if (token.length !== expectedToken.length) return false;

    let result = 0;
    for (let i = 0; i < token.length; i++) {
        result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
    }

    return result === 0;
}

// ============================================
// Audit Logging
// ============================================

interface AuditLogEntry {
    timestamp: Date;
    action: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
    details: Record<string, unknown>;
}

const auditLogs: AuditLogEntry[] = [];
const MAX_AUDIT_LOGS = 1000;

/**
 * Log security-relevant action
 */
export function auditLog(
    action: string,
    details: Record<string, unknown>,
    context?: { userId?: string; ip?: string; userAgent?: string }
): void {
    const entry: AuditLogEntry = {
        timestamp: new Date(),
        action,
        userId: context?.userId,
        ip: context?.ip,
        userAgent: context?.userAgent,
        details,
    };

    auditLogs.unshift(entry);

    // Keep only recent logs
    if (auditLogs.length > MAX_AUDIT_LOGS) {
        auditLogs.pop();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
        console.log('[Audit]', action, details);
    }
}

/**
 * Get recent audit logs
 */
export function getAuditLogs(limit: number = 100): AuditLogEntry[] {
    return auditLogs.slice(0, limit);
}
