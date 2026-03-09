import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type {
  AdaptationEvaluationRecord,
  AdaptationEvaluationRepository,
  PersistenceTransaction,
  TransactionFactory,
} from './adaptationEvaluationPersistence.js';

export type StoredAdaptationEvaluationRecord = AdaptationEvaluationRecord & {
  evaluation_id: string;
  persisted_at: string;
  previous_record_hash: string | null;
  record_hash: string;
};

function computeRecordHash(record: Omit<StoredAdaptationEvaluationRecord, 'record_hash'>): string {
  const content = JSON.stringify(record);
  return createHash('sha256').update(content).digest('hex');
}

export class FilePersistenceTransaction implements PersistenceTransaction {
  private pending: StoredAdaptationEvaluationRecord[] = [];
  private finalized = false;

  constructor(private readonly filePath: string) {}

  async stage(record: AdaptationEvaluationRecord): Promise<string> {
    if (this.finalized) {
      throw new Error('transaction already finalized');
    }

    const existing = await readStoredEvaluationsOrEmpty(this.filePath);
    const previousRecordHash = this.pending.length > 0
      ? this.pending[this.pending.length - 1]?.record_hash ?? null
      : existing[existing.length - 1]?.record_hash ?? null;

    const withoutHash = {
      ...record,
      evaluation_id: `eval_${randomUUID()}`,
      persisted_at: new Date().toISOString(),
      previous_record_hash: previousRecordHash,
    };

    const storedRecord: StoredAdaptationEvaluationRecord = {
      ...withoutHash,
      record_hash: computeRecordHash(withoutHash),
    };

    this.pending.push(storedRecord);
    return storedRecord.evaluation_id;
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

    return tx.stage(record);
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

export function verifyStoredEvaluationChain(records: StoredAdaptationEvaluationRecord[]): boolean {
  for (let i = 0; i < records.length; i += 1) {
    const current = records[i];
    if (!current) return false;

    const expectedPrevious = i > 0 ? records[i - 1]?.record_hash ?? null : null;
    if (current.previous_record_hash !== expectedPrevious) {
      return false;
    }

    const { record_hash: _, ...withoutHash } = current;
    const expectedHash = computeRecordHash(withoutHash);
    if (current.record_hash !== expectedHash) {
      return false;
    }
  }

  return true;
}
