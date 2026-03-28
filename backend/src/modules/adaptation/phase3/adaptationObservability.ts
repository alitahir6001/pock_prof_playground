export type AdaptationDiagnosticCode =
  | 'VALIDATION_ERROR'
  | 'AUDIT_PERSISTENCE_FAILURE'
  | 'CONFIGURATION_ERROR'
  | 'UNKNOWN_ERROR';

const VALIDATION_PATTERNS = [
  'must be valid ISO timestamp',
  'is required',
  'must be non-negative',
  'BAD_REQUEST',
];

const CONFIG_PATTERNS = [
  'postgresPool is required',
  'auditFilePath is required',
  'must be provided together',
  'ADAPTATION_DATABASE_URL',
  'DATABASE_URL',
];

export function classifyAdaptationError(error: unknown): AdaptationDiagnosticCode {
  const message = error instanceof Error ? error.message : String(error);

  if (message === 'AUDIT_PERSISTENCE_FAILED') {
    return 'AUDIT_PERSISTENCE_FAILURE';
  }

  if (CONFIG_PATTERNS.some((pattern) => message.includes(pattern))) {
    return 'CONFIGURATION_ERROR';
  }

  if (VALIDATION_PATTERNS.some((pattern) => message.includes(pattern))) {
    return 'VALIDATION_ERROR';
  }

  return 'UNKNOWN_ERROR';
}
