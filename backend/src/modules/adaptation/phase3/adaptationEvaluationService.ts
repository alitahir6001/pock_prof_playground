import {
  evaluatePolicies,
  type PolicyInput,
  type PolicyOutput,
  STRUCTURAL_MUTATION_TYPES,
} from './policyEngine.js';
import { buildAdaptationEvaluationRecord } from './adaptationEvaluationRecord.js';
import {
  persistAdaptationEvaluationOrThrow,
  type AdaptationEvaluationRepository,
  type TransactionFactory,
} from './adaptationEvaluationPersistence.js';

export type RunAdaptationEvaluationParams = {
  policy_input: PolicyInput;
  trigger_window: string;
  previous_state: Record<string, unknown>;
  new_state: Record<string, unknown>;
  txFactory: TransactionFactory;
  repository: AdaptationEvaluationRepository;
};

export type RunAdaptationEvaluationResult = {
  policy_output: PolicyOutput;
  evaluation_id: string;
};

function hasStructuralMutation(output: PolicyOutput): boolean {
  return output.mutations.some((mutation) => {
    const mutationType = mutation.mutation_applied?.type;
    return STRUCTURAL_MUTATION_TYPES.has(String(mutationType));
  });
}

export async function runAdaptationEvaluationCycle(
  params: RunAdaptationEvaluationParams,
): Promise<RunAdaptationEvaluationResult> {
  if (!params || typeof params !== 'object') {
    throw new Error('params are required.');
  }

  const policyOutput = evaluatePolicies(params.policy_input);

  const record = buildAdaptationEvaluationRecord({
    user_id: params.policy_input.user_id,
    evaluated_at: params.policy_input.evaluated_at,
    engine_output: policyOutput,
    trigger_window: params.trigger_window,
    previous_state: params.previous_state,
    new_state: params.new_state,
  });

  const persistenceResult = await persistAdaptationEvaluationOrThrow({
    record,
    hasStructuralMutation: hasStructuralMutation(policyOutput),
    txFactory: params.txFactory,
    repository: params.repository,
  });

  return {
    policy_output: policyOutput,
    evaluation_id: persistenceResult.evaluation_id,
  };
}
