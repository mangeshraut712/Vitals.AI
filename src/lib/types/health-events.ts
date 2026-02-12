export type HealthEventDomain =
  | 'biomarker'
  | 'activity'
  | 'body_comp'
  | 'longevity'
  | 'system';

export type HealthEventSeverity = 'info' | 'warning' | 'critical';

export type HealthEventSource =
  | 'bloodwork'
  | 'dexa'
  | 'activity'
  | 'whoop'
  | 'apple'
  | 'oura'
  | 'fitbit'
  | 'unknown'
  | 'system';

export type HealthEventValue = number | string | null;

export interface HealthEvent {
  id: string;
  domain: HealthEventDomain;
  severity: HealthEventSeverity;
  source: HealthEventSource;
  metric: string;
  summary: string;
  value: HealthEventValue;
  unit?: string;
  status?: string;
  occurredAt: string;
  recordedAt: string;
  confidence: number;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface HealthEventQuery {
  limit?: number;
  domains?: HealthEventDomain[];
  severities?: HealthEventSeverity[];
}

