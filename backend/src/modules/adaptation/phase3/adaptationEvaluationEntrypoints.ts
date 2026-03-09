import { createFilePersistenceAdapter } from './adaptationEvaluationFileAdapter.js';
import {
  AUDIT_PERSISTENCE_FAILED,
  type AdaptationEvaluationRepository,
  type TransactionFactory,
} from './adaptationEvaluationPersistence.js';
import {
  runAdaptationEvaluationCycle,
  type RunAdaptationEvaluationParams,
  type RunAdaptationEvaluationResult,
} from './adaptationEvaluationService.js';

export type AdaptationEvaluationRequest = {
  user_id: string;
  evaluated_at: string;
  trigger_window: string;
  weekly_structural_mutations_applied: number;
  counters: RunAdaptationEvaluationParams['policy_input']['counters'];
  previous_state: Record<string, unknown>;
  new_state: Record<string, unknown>;
};

type EntrypointDependencies = {
  txFactory: TransactionFactory;
  repository: AdaptationEvaluationRepository;
};

function validateRequest(request: unknown): asserts request is AdaptationEvaluationRequest {
  if (!request || typeof request !== 'object') {
    throw new Error('request is required.');
  }

  const r = request as Partial<AdaptationEvaluationRequest>;
  if (typeof r.user_id !== 'string' || r.user_id.length < 1) throw new Error('user_id is required.');
  if (typeof r.evaluated_at !== 'string' || Number.isNaN(Date.parse(r.evaluated_at))) {
    throw new Error('evaluated_at must be valid ISO timestamp string.');
  }
  if (typeof r.trigger_window !== 'string' || r.trigger_window.length < 1) throw new Error('trigger_window is required.');
  if (typeof r.weekly_structural_mutations_applied !== 'number' || r.weekly_structural_mutations_applied < 0) {
    throw new Error('weekly_structural_mutations_applied must be non-negative number.');
  }
  if (!r.counters || typeof r.counters !== 'object') throw new Error('counters are required.');
  if (!r.previous_state || typeof r.previous_state !== 'object') throw new Error('previous_state is required.');
  if (!r.new_state || typeof r.new_state !== 'object') throw new Error('new_state is required.');
}

function resolveDependencies(params: {
  auditFilePath?: string;
  txFactory?: TransactionFactory;
  repository?: AdaptationEvaluationRepository;
}): EntrypointDependencies {
  if (params.txFactory && params.repository) {
    return { txFactory: params.txFactory, repository: params.repository };
  }

  if (params.txFactory || params.repository) {
    throw new Error('txFactory and repository must be provided together.');
  }

  if (!params.auditFilePath || params.auditFilePath.length < 1) {
    throw new Error('auditFilePath is required when custom dependencies are not provided.');
  }

  return createFilePersistenceAdapter(params.auditFilePath);
}

function toServiceParams(request: AdaptationEvaluationRequest, deps: EntrypointDependencies): RunAdaptationEvaluationParams {
  return {
    policy_input: {
      user_id: request.user_id,
      evaluated_at: request.evaluated_at,
      weekly_structural_mutations_applied: request.weekly_structural_mutations_applied,
      counters: request.counters,
    },
    trigger_window: request.trigger_window,
    previous_state: request.previous_state,
    new_state: request.new_state,
    txFactory: deps.txFactory,
    repository: deps.repository,
  };
}

export type AdaptationApiResponse =
  | { ok: true; result: RunAdaptationEvaluationResult }
  | { ok: false; error_code: 'AUDIT_PERSISTENCE_FAILED'; detail: string };

export async function handleAdaptationEvaluationApiRequest(
  request: unknown,
  params: { auditFilePath?: string; txFactory?: TransactionFactory; repository?: AdaptationEvaluationRepository },
): Promise<AdaptationApiResponse> {
  validateRequest(request);
  const deps = resolveDependencies(params);

  try {
    const result = await runAdaptationEvaluationCycle(toServiceParams(request, deps));
    return { ok: true, result };
  } catch (error) {
    if (error instanceof Error && error.message === AUDIT_PERSISTENCE_FAILED) {
      return { ok: false, error_code: AUDIT_PERSISTENCE_FAILED, detail: 'Structural mutation blocked due to audit persistence failure.' };
    }
    throw error;
  }
}

export async function handleAdaptationEvaluationWorkerJob(params: {
  job_id: string;
  request: unknown;
  auditFilePath?: string;
  txFactory?: TransactionFactory;
  repository?: AdaptationEvaluationRepository;
}): Promise<{ job_id: string; status: 'completed'; evaluation_id: string; applied_rule_count: number }> {
  if (typeof params.job_id !== 'string' || params.job_id.length < 1) {
    throw new Error('job_id is required.');
  }

  const response = await handleAdaptationEvaluationApiRequest(params.request, {
    auditFilePath: params.auditFilePath,
    txFactory: params.txFactory,
    repository: params.repository,
  });

  if (!response.ok) {
    throw new Error(response.error_code);
  }

  return {
    job_id: params.job_id,
    status: 'completed',
    evaluation_id: response.result.evaluation_id,
    applied_rule_count: response.result.policy_output.applied_rules.length,
  };
}
