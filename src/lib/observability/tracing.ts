import { context, SpanStatusCode, trace, type Span, type Tracer } from '@opentelemetry/api';

const TRACER_NAME = 'vitals-ai-agent';
const SERVICE_NAME = 'vitals-ai';

let initialized = false;

export function isTracingEnabled(): boolean {
  if (process.env.OTEL_SDK_DISABLED === 'true') return false;
  const exporter = process.env.OTEL_TRACES_EXPORTER?.trim();
  if (exporter && exporter !== 'none') return true;
  if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim()) return true;
  if (process.env.OTEL_ENABLED === '1' || process.env.OTEL_ENABLED === 'true') return true;
  return false;
}

export function getTracer(): Tracer {
  return trace.getTracer(TRACER_NAME, '0.1.0');
}

export async function withSpan<T>(
  name: string,
  attributes: Record<string, string | number | boolean>,
  fn: () => Promise<T>
): Promise<T> {
  const tracer = getTracer();
  return tracer.startActiveSpan(name, async (span: Span) => {
    try {
      span.setAttributes(attributes);
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message });
      if (error instanceof Error) span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}

export function getActiveTraceId(): string | undefined {
  const spanContext = trace.getSpanContext(context.active());
  return spanContext?.traceId;
}

/**
 * Register a tracer provider. Safe to call more than once.
 *
 * Enable locally:
 *   OTEL_ENABLED=1 npm run dev
 *
 * Optional OTLP:
 *   OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318 npm run dev
 */
export async function initTracing(): Promise<void> {
  if (initialized) return;
  initialized = true;

  if (!isTracingEnabled()) {
    return;
  }

  const { NodeTracerProvider, BatchSpanProcessor, ConsoleSpanExporter, SimpleSpanProcessor } = await import(
    '@opentelemetry/sdk-trace-node'
  );

  const processors: import('@opentelemetry/sdk-trace-base').SpanProcessor[] = [];
  const useConsole =
    process.env.OTEL_TRACES_EXPORTER === 'console' ||
    (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT && Boolean(process.env.OTEL_ENABLED));

  if (useConsole) {
    processors.push(new SimpleSpanProcessor(new ConsoleSpanExporter()));
  }

  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim();
  if (otlpEndpoint) {
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
    processors.push(new BatchSpanProcessor(new OTLPTraceExporter()));
  }

  const provider = new NodeTracerProvider({ spanProcessors: processors });
  provider.register();
  getTracer().startSpan('observability.init', {
    attributes: { 'service.name': SERVICE_NAME },
  }).end();
}
