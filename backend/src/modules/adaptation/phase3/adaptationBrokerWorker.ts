import {
  classifyAdaptationError,
  type AdaptationDiagnosticCode,
} from './adaptationObservability.js';
import { resolveRetryDirective } from './adaptationWorkerRetryPolicy.js';
import { AdaptationTelemetryAggregator, type TelemetrySnapshot } from './adaptationTelemetryAggregator.js';

export type BrokerEnvelope = {
  message_id: string;
  attempt: number;
  max_attempts: number;
  worker_message: {
    job_id: string;
    payload: unknown;
  };
};

export type BrokerProcessResult = {
  telemetry: TelemetrySnapshot;
  retry_queue: BrokerEnvelope[];
  dead_letter_queue: Array<BrokerEnvelope & { error_code: string; diagnostic_code: string }>;
};


function normalizeDiagnosticCode(value: unknown, fallbackSource: unknown): AdaptationDiagnosticCode {
  const allowed: AdaptationDiagnosticCode[] = [
    'VALIDATION_ERROR',
    'AUDIT_PERSISTENCE_FAILURE',
    'CONFIGURATION_ERROR',
    'UNKNOWN_ERROR',
  ];

  if (typeof value === 'string' && allowed.includes(value as AdaptationDiagnosticCode)) {
    return value as AdaptationDiagnosticCode;
  }

  return classifyAdaptationError(fallbackSource);
}

export async function processBrokerBatch(params: {
  messages: BrokerEnvelope[];
  processWorker: (message: BrokerEnvelope['worker_message']) => Promise<{ status: 'completed' | 'failed'; error_code?: string; diagnostic_code?: string }>;
}): Promise<BrokerProcessResult> {
  const telemetry = new AdaptationTelemetryAggregator();
  const retryQueue: BrokerEnvelope[] = [];
  const deadLetter: Array<BrokerEnvelope & { error_code: string; diagnostic_code: string }> = [];

  telemetry.increment('broker_messages_total', params.messages.length);

  for (const message of params.messages) {
    try {
      const result = await params.processWorker(message.worker_message);

      if (result.status === 'completed') {
        telemetry.increment('broker_messages_completed');
        continue;
      }

      const diagnosticCode = normalizeDiagnosticCode(result.diagnostic_code, result.error_code ?? 'WORKER_FAILURE');
      const retry = resolveRetryDirective({
        attempt: message.attempt,
        max_attempts: message.max_attempts,
        diagnostic_code: diagnosticCode,
      });

      if (retry.retryable && retry.next_attempt !== null) {
        retryQueue.push({
          ...message,
          attempt: retry.next_attempt,
        });
        telemetry.increment('broker_messages_retried');
      } else {
        deadLetter.push({
          ...message,
          error_code: result.error_code ?? 'WORKER_FAILURE',
          diagnostic_code: diagnosticCode,
        });
        telemetry.increment('broker_messages_dead_lettered');
      }
    } catch (error) {
      const diagnosticCode = classifyAdaptationError(error);
      const retry = resolveRetryDirective({
        attempt: message.attempt,
        max_attempts: message.max_attempts,
        diagnostic_code: diagnosticCode,
      });

      if (retry.retryable && retry.next_attempt !== null) {
        retryQueue.push({
          ...message,
          attempt: retry.next_attempt,
        });
        telemetry.increment('broker_messages_retried');
      } else {
        deadLetter.push({
          ...message,
          error_code: error instanceof Error ? error.message : String(error),
          diagnostic_code: diagnosticCode,
        });
        telemetry.increment('broker_messages_dead_lettered');
      }
    }
  }

  return {
    telemetry: telemetry.snapshot(),
    retry_queue: retryQueue,
    dead_letter_queue: deadLetter,
  };
}
