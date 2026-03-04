import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import type {
  AdaptationEvaluationRecord,
  AdaptationEvaluationRepository,
  PersistenceTransaction,
  TransactionFactory,
} from './adaptationEvaluationPersistence.js';

export type StoredAdaptationEvaluationRecord = AdaptationEvaluationRecord & {
  evaluation_id: string;
  persisted_at: string;
};

export class FilePersistenceTransaction implements PersistenceTransaction {
  private pending: StoredAdaptationEvaluationRecord[] = [];
  private finalized = false;

  constructor(private readonly filePath: string) {}

  stage(record: StoredAdaptationEvaluationRecord): void {
    if (this.finalized) {
      throw new Error('transaction already finalized');
    }
    this.pending.push(record);
  }

  async commit(): Promise<void> {
    if (this.finalized) {
      throw new Error('transaction already finalized');
    }

    const parentDir = dirname(this.filePath);
    await mkdir(parentDir, { recursive: true });

    const existing = await readStoredEvaluationsOrEmpty(this.filePath);
    const next = [...existing, ...this.pending];
    const tempPath = `${this.filePath}.tmp`;

    await writeFile(tempPath, JSON.stringify(next, null, 2), 'utf8');
    await rename(tempPath, this.filePath);

    this.pending = [];
    this.finalized = true;
  }

  async rollback(): Promise<void> {
    this.pending = [];
    this.finalized = true;
  }
}

export class FileTransactionFactory implements TransactionFactory {
  constructor(private readonly filePath: string) {}

  async begin(): Promise<FilePersistenceTransaction> {
    return new FilePersistenceTransaction(this.filePath);
  }
}

export class FileAdaptationEvaluationRepository implements AdaptationEvaluationRepository {
  async insertEvaluation(record: AdaptationEvaluationRecord, tx: PersistenceTransaction): Promise<string> {
    if (!(tx instanceof FilePersistenceTransaction)) {
      throw new Error('FileAdaptationEvaluationRepository requires FilePersistenceTransaction');
    }

    const evaluationId = `eval_${randomUUID()}`;

    tx.stage({
      ...record,
      evaluation_id: evaluationId,
      persisted_at: new Date().toISOString(),
    });

    return evaluationId;
  }
}

export function createFilePersistenceAdapter(filePath: string): {
  txFactory: TransactionFactory;
  repository: AdaptationEvaluationRepository;
} {
  return {
    txFactory: new FileTransactionFactory(filePath),
    repository: new FileAdaptationEvaluationRepository(),
  };
}

export async function readStoredEvaluationsOrEmpty(
  filePath: string,
): Promise<StoredAdaptationEvaluationRecord[]> {
  try {
    const raw = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredAdaptationEvaluationRecord[]) : [];
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'ENOENT'
    ) {
      return [];
    }
    throw error;
  }
}
