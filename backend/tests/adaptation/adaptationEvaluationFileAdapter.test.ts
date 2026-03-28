import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { persistAdaptationEvaluationOrThrow } from '../../src/modules/adaptation/phase3/adaptationEvaluationPersistence.js';
import {
  createFilePersistenceAdapter,
  FileAdaptationEvaluationRepository,
  readStoredEvaluationsOrEmpty,
  verifyStoredEvaluationChain,
} from '../../src/modules/adaptation/phase3/adaptationEvaluationFileAdapter.js';

function baseRecord() {
  return {
    user_id: 'u_file_1',
    evaluation_time: '2026-02-03T10:00:00.000Z',
    trigger_window: '7d',
    events_used_json: ['session_missed'],
    applied_rule_ids_json: ['R_MISSED_2_IN_7D_REDUCE_WORKLOAD_25'],
    mutations_json: [
      {
        rule_id: 'R_MISSED_2_IN_7D_REDUCE_WORKLOAD_25',
        trigger_window: '7d',
        events_used: ['session_missed'],
        mutation_applied: {
          type: 'workload_adjustment',
          workload_delta_percent: -25,
        },
      },
    ],
    previous_state_json: { workload: 100 },
    new_state_json: { workload: 75 },
    deferred_mutations_json: [],
  };
}

test('persists adaptation evaluation records to a concrete JSON file store', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'pp-file-adapter-'));

  try {
    const filePath = join(tempDir, 'adaptation-evaluations.json');
    const { txFactory, repository } = createFilePersistenceAdapter(filePath);

    const first = await persistAdaptationEvaluationOrThrow({
      record: baseRecord(),
      hasStructuralMutation: false,
      txFactory,
      repository,
    });

    const second = await persistAdaptationEvaluationOrThrow({
      record: { ...baseRecord(), user_id: 'u_file_2' },
      hasStructuralMutation: false,
      txFactory,
      repository,
    });

    assert.equal(first.evaluation_id.startsWith('eval_'), true);
    assert.equal(second.evaluation_id.startsWith('eval_'), true);
    assert.notEqual(first.evaluation_id, second.evaluation_id);

    const rows = await readStoredEvaluationsOrEmpty(filePath);
    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.user_id, 'u_file_1');
    assert.equal(rows[1]?.user_id, 'u_file_2');
    assert.equal(typeof rows[0]?.persisted_at, 'string');
    assert.equal(rows[0]?.previous_record_hash, null);
    assert.equal(rows[1]?.previous_record_hash, rows[0]?.record_hash);
    assert.equal(verifyStoredEvaluationChain(rows), true);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('throws when file repository receives non-file transaction', async () => {
  const repository = new FileAdaptationEvaluationRepository();

  await assert.rejects(
    () =>
      repository.insertEvaluation(baseRecord(), {
        async commit() {},
        async rollback() {},
      }),
    /requires FilePersistenceTransaction/,
  );
});

test('detects audit chain tampering', () => {
  const rows = [
    {
      ...baseRecord(),
      evaluation_id: 'eval_1',
      persisted_at: '2026-02-01T00:00:00.000Z',
      previous_record_hash: null,
      record_hash: 'abc',
    },
  ];

  assert.equal(verifyStoredEvaluationChain(rows as any), false);
});
