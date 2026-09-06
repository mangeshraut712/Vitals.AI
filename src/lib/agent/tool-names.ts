export const HEALTH_TOOL_NAMES = [
  'lookupBiomarker',
  'getRecoverySnapshot',
  'getHealthScorecard',
] as const;

export type HealthToolName = (typeof HEALTH_TOOL_NAMES)[number];

export function isHealthToolName(value: string): value is HealthToolName {
  return (HEALTH_TOOL_NAMES as readonly string[]).includes(value);
}

export function assertNever(value: never, message: string): never {
  throw new Error(`${message}: ${String(value)}`);
}
