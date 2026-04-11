import type { AdaptationDiagnosticCode } from './adaptationObservability.js';

export type RetryDirective = {
  retryable: boolean;
  next_attempt: number | null;
  reason: string;
};

export function resolveRetryDirective(params: {
  attempt: number;
  max_attempts: number;
  diagnostic_code: AdaptationDiagnosticCode;
}): RetryDirective {
  const { attempt, max_attempts, diagnostic_code } = params;

  if (attempt >= max_attempts) {
    return {
      retryable: false,
      next_attempt: null,
      reason: 'MAX_ATTEMPTS_REACHED',
    };
  }

  if (diagnostic_code === 'VALIDATION_ERROR' || diagnostic_code === 'CONFIGURATION_ERROR') {
    return {
      retryable: false,
      next_attempt: null,
      reason: 'NON_RETRYABLE_DIAGNOSTIC',
    };
  }

  return {
    retryable: true,
    next_attempt: attempt + 1,
    reason: 'RETRYABLE_FAILURE',
  };
}
