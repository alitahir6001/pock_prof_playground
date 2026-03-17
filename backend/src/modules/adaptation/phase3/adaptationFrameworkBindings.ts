import {
  handleAdaptationEvaluationApiRequest,
  handleAdaptationEvaluationWorkerJob,
  type AdaptationEvaluationRequest,
} from './adaptationEvaluationEntrypoints.js';
import type {
  AdaptationEvaluationRepository,
  TransactionFactory,
} from './adaptationEvaluationPersistence.js';

export type FrameworkBindingDependencies = {
  auditFilePath?: string;
  txFactory?: TransactionFactory;
  repository?: AdaptationEvaluationRepository;
};

export type HttpLikeRequest = {
  body: unknown;
};

export type HttpLikeResponse = {
  status: number;
  json: Record<string, unknown>;
};

export async function handleAdaptationHttpRoute(
  request: HttpLikeRequest,
  deps: FrameworkBindingDependencies,
): Promise<HttpLikeResponse> {
  try {
    const apiResponse = await handleAdaptationEvaluationApiRequest(request.body, deps);

    if (!apiResponse.ok) {
      return {
        status: 503,
        json: {
          ok: false,
          error_code: apiResponse.error_code,
          detail: apiResponse.detail,
        },
      };
    }

    return {
      status: 200,
      json: {
        ok: true,
        evaluation_id: apiResponse.result.evaluation_id,
        policy_output: apiResponse.result.policy_output,
      },
    };
  } catch (error) {
    return {
      status: 400,
      json: {
        ok: false,
        error_code: 'BAD_REQUEST',
        detail: error instanceof Error ? error.message : 'Unknown request error.',
      },
    };
  }
}

export type WorkerMessage = {
  job_id: string;
  payload: AdaptationEvaluationRequest;
};

export type WorkerResultMessage = {
  job_id: string;
  status: 'completed' | 'failed';
  evaluation_id?: string;
  applied_rule_count?: number;
  error_code?: string;
};

export async function handleAdaptationWorkerMessage(
  message: WorkerMessage,
  deps: FrameworkBindingDependencies,
): Promise<WorkerResultMessage> {
  try {
    const result = await handleAdaptationEvaluationWorkerJob({
      job_id: message.job_id,
      request: message.payload,
      auditFilePath: deps.auditFilePath,
      txFactory: deps.txFactory,
      repository: deps.repository,
    });

    return {
      job_id: result.job_id,
      status: 'completed',
      evaluation_id: result.evaluation_id,
      applied_rule_count: result.applied_rule_count,
    };
  } catch (error) {
    const code = error instanceof Error ? error.message : 'WORKER_FAILURE';
    return {
      job_id: message.job_id,
      status: 'failed',
      error_code: code,
    };
  }
}
