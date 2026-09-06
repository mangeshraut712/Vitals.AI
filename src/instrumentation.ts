export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { initTracing } = await import('@/lib/observability/tracing');
  await initTracing();
}
