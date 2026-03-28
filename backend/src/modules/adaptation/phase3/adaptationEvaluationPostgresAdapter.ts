import { randomUUID } from 'node:crypto';
import type {
  AdaptationEvaluationRecord,
  AdaptationEvaluationRepository,
  PersistenceTransaction,
  TransactionFactory,
} from './adaptationEvaluationPersistence.js';

export interface PostgresClientLike {
  query(sql: string, params?: unknown[]): Promise<{ rows?: Array<Record<string, unknown>> }>;
  release(): void;
}

export interface PostgresPoolLike {
  connect(): Promise<PostgresClientLike>;
}

export class PostgresPersistenceTransaction implements PersistenceTransaction {
  private finalized = false;

  constructor(public readonly client: PostgresClientLike) {}

  async commit(): Promise<void> {
    if (this.finalized) {
      throw new Error('transaction already finalized');
    }

    await this.client.query('COMMIT');
    this.client.release();
    this.finalized = true;
  }

  async rollback(): Promise<void> {
    if (this.finalized) {
      throw new Error('transaction already finalized');
    }

    await this.client.query('ROLLBACK');
    this.client.release();
    this.finalized = true;
  }
}

export class PostgresTransactionFactory implements TransactionFactory {
  constructor(private readonly pool: PostgresPoolLike) {}

  async begin(): Promise<PostgresPersistenceTransaction> {
    const client = await this.pool.connect();
    await client.query('BEGIN');
    return new PostgresPersistenceTransaction(client);
  }
}

export class PostgresAdaptationEvaluationRepository implements AdaptationEvaluationRepository {
  async insertEvaluation(
    record: AdaptationEvaluationRecord,
    tx: PersistenceTransaction,
  ): Promise<string> {
    if (!(tx instanceof PostgresPersistenceTransaction)) {
      throw new Error('PostgresAdaptationEvaluationRepository requires PostgresPersistenceTransaction');
    }

    const evaluationId = `eval_${randomUUID()}`;

    const sql = `
      INSERT INTO adaptation_evaluations (
        evaluation_id,
        user_id,
        evaluation_time,
        trigger_window,
        events_used_json,
        applied_rule_ids_json,
        mutations_json,
        previous_state_json,
        new_state_json,
        deferred_mutations_json
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      )
      RETURNING evaluation_id
    `;

    const result = await tx.client.query(sql, [
      evaluationId,
      record.user_id,
      record.evaluation_time,
      record.trigger_window,
      record.events_used_json,
      record.applied_rule_ids_json,
      record.mutations_json,
      record.previous_state_json,
      record.new_state_json,
      record.deferred_mutations_json,
    ]);

    const returned = result.rows?.[0]?.evaluation_id;
    return typeof returned === 'string' ? returned : evaluationId;
  }
}

export function createPostgresPersistenceAdapter(pool: PostgresPoolLike): {
  txFactory: TransactionFactory;
  repository: AdaptationEvaluationRepository;
} {
  return {
    txFactory: new PostgresTransactionFactory(pool),
    repository: new PostgresAdaptationEvaluationRepository(),
  };
}
