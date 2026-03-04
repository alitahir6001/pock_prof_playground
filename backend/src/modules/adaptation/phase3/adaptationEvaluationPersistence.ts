import type { PolicyOutput } from './policyEngine.js';

export type AdaptationEvaluationRecord = {
  user_id: string;
  evaluation_time: string;
  trigger_window: string;
  events_used_json: string[];
  applied_rule_ids_json: string[];
  mutations_json: PolicyOutput['mutations'];
  previous_state_json: Record<string, unknown>;
  new_state_json: Record<string, unknown>;
  deferred_mutations_json: PolicyOutput['deferred_mutations'];
};

export interface PersistenceTransaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface TransactionFactory {
  begin(): Promise<PersistenceTransaction>;
}

export interface AdaptationEvaluationRepository {
  insertEvaluation(record: AdaptationEvaluationRecord, tx: PersistenceTransaction): Promise<string>;
}

export const AUDIT_PERSISTENCE_FAILED = 'AUDIT_PERSISTENCE_FAILED';

export async function persistAdaptationEvaluationOrThrow(params: {
  record: AdaptationEvaluationRecord;
  hasStructuralMutation: boolean;
  txFactory: TransactionFactory;
  repository: AdaptationEvaluationRepository;
}): Promise<{ evaluation_id: string }> {
  const tx = await params.txFactory.begin();

  try {
    const evaluationId = await params.repository.insertEvaluation(params.record, tx);
    await tx.commit();
    return { evaluation_id: evaluationId };
  } catch (error) {
    try {
      await tx.rollback();
    } catch {
      // rollback best effort; preserve fail-closed behavior via thrown error below
    }

    if (params.hasStructuralMutation) {
      throw new Error(AUDIT_PERSISTENCE_FAILED);
    }

    throw error;
  }
}
