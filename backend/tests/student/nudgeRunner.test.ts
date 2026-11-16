import test from 'node:test';
import assert from 'node:assert/strict';
import {
  nudgeModeFromEnv,
  parseAllowlist,
  runNudgeTick,
  type NudgeRunnerDeps,
} from '../../src/modules/student/nudgeRunner.js';
import type { Queryable } from '../../src/modules/student/studentFileStore.js';

type Row = Record<string, unknown>;

const USER = {
  user_id: 'user_1',
  email: 'Tester@Example.test',
  time_zone: 'UTC',
  nudge_stop_token: 'tok_abcdefghijklmnop',
  reminder_time: '18:00',
  sprint_day_count: 14,
};
const TODAY = '2026-11-15';
const SIX_PM = new Date('2026-11-15T18:00:00Z');
const later = (minutes: number) => new Date(SIX_PM.getTime() + minutes * 60_000);

function seedRow(eventType: string, localDate: string): Row {
  return {
    event_id: `evt_seed_${eventType}_${localDate}`,
    user_id: 'user_1',
    event_type: eventType,
    local_date: localDate,
    occurred_at: new Date(`${localDate}T12:00:00Z`),
    payload_json: {},
  };
}

/** In-memory stand-in for the statements the runner and the store issue. */
function fakeDb(seed: Row[], options: { rejectNudgeInsert?: boolean } = {}) {
  const rows: Row[] = [...seed];
  let tick = 0;
  const db: Queryable = {
    async query(text: string, params: unknown[] = []) {
      if (text.includes('reminder_time IS NOT NULL')) return { rows: [USER] };
      if (text.includes('FROM pilot_users')) return { rows: [USER] };
      if (text.includes('INSERT INTO pilot_student_events')) {
        const [eventId, userId, eventType, localDate, payload] = params as string[];
        const daily = ['session_missed', 'nudge_sent', 'nudge_skipped'].includes(eventType);
        const clash = daily && rows.some((r) => r.event_type === eventType && r.local_date === localDate);
        // rejectNudgeInsert: another process won the race for today's nudge_sent row.
        if (clash || (options.rejectNudgeInsert && eventType === 'nudge_sent')) return { rows: [] };
        tick += 1;
        rows.push({
          event_id: eventId,
          user_id: userId,
          event_type: eventType,
          local_date: localDate,
          occurred_at: new Date(Date.UTC(2026, 10, 15, 18, 0, tick)),
          payload_json: JSON.parse(payload),
        });
        return { rows: [{ event_id: eventId }] };
      }
      return { rows: [...rows] };
    },
  };
  const of = (type: string) => rows.filter((r) => r.event_type === type);
  return { db, of };
}

function deps(overrides: Partial<NudgeRunnerDeps> = {}) {
  const sent: Array<{ to: string; subject: string; text: string }> = [];
  const d: NudgeRunnerDeps = {
    mode: 'send',
    allowlist: [],
    appUrl: 'https://app.example',
    sendEmail: async (message) => {
      sent.push(message);
    },
    log: () => {},
    ...overrides,
  };
  return { d, sent };
}

const STARTED = [seedRow('plan_started', '2026-11-10'), seedRow('session_completed', '2026-11-14')];

test('several ticks inside the window: one email, one nudge_sent row', async () => {
  const { db, of } = fakeDb(STARTED);
  const { d, sent } = deps();
  for (const m of [0, 1, 2, 30, 60]) await runNudgeTick(db, later(m), d);

  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, 'tester@example.test');
  assert.ok(sent[0].text.includes('https://app.example/#stop=tok_abcdefghijklmnop'));
  assert.equal(of('nudge_sent').length, 1);
  assert.equal((of('nudge_sent')[0].payload_json as Row).dry_run, false);
  assert.equal(of('nudge_sent')[0].local_date, TODAY);
});

test('before the reminder time: nothing sent, nothing recorded', async () => {
  const { db, of } = fakeDb(STARTED);
  const { d, sent } = deps();
  await runNudgeTick(db, later(-5), d);
  assert.equal(sent.length, 0);
  assert.equal(of('nudge_sent').length, 0);
});

test('session already done today: nudge_skipped, no email', async () => {
  const { db, of } = fakeDb([...STARTED, seedRow('session_completed', TODAY)]);
  const { d, sent } = deps();
  await runNudgeTick(db, SIX_PM, d);
  await runNudgeTick(db, later(1), d);

  assert.equal(sent.length, 0);
  assert.equal(of('nudge_sent').length, 0);
  assert.equal(of('nudge_skipped').length, 1);
});

test('log mode: the row is written as a dry run and no email goes out', async () => {
  const { db, of } = fakeDb(STARTED);
  const { d, sent } = deps({ mode: 'log' });
  await runNudgeTick(db, SIX_PM, d);

  assert.equal(sent.length, 0);
  assert.deepEqual(of('nudge_sent').map((r) => r.payload_json), [
    { reminder_time: '18:00', dry_run: true, dry_run_reason: 'log_mode' },
  ]);
});

test('send mode with an allowlist: an unlisted address gets a dry run only', async () => {
  const { db, of } = fakeDb(STARTED);
  const { d, sent } = deps({ allowlist: ['someone-else@example.test'] });
  await runNudgeTick(db, SIX_PM, d);

  assert.equal(sent.length, 0);
  assert.equal((of('nudge_sent')[0].payload_json as Row).dry_run_reason, 'not_on_allowlist');
});

test('send mode with an allowlist: a listed address gets the email', async () => {
  const { db } = fakeDb(STARTED);
  const { d, sent } = deps({ allowlist: ['tester@example.test'] });
  await runNudgeTick(db, SIX_PM, d);
  assert.equal(sent.length, 1);
});

test('the insert is refused (someone else recorded today’s nudge): no email', async () => {
  const { db } = fakeDb(STARTED, { rejectNudgeInsert: true });
  const { d, sent } = deps();
  await runNudgeTick(db, SIX_PM, d);
  assert.equal(sent.length, 0);
});

test('the send fails: nudge_failed is recorded and there is no retry that day', async () => {
  const { db, of } = fakeDb(STARTED);
  let attempts = 0;
  const { d } = deps({
    sendEmail: async () => {
      attempts += 1;
      throw new Error('Resend is down');
    },
  });
  await runNudgeTick(db, SIX_PM, d);
  await runNudgeTick(db, later(1), d);

  assert.equal(attempts, 1);
  assert.equal(of('nudge_sent').length, 1);
  assert.equal(of('nudge_failed').length, 1);
  assert.equal((of('nudge_failed')[0].payload_json as Row).error, 'Resend is down');
});

test('mode is log unless NUDGE_MODE is exactly "send"', () => {
  assert.equal(nudgeModeFromEnv(undefined), 'log');
  assert.equal(nudgeModeFromEnv('SEND'), 'log');
  assert.equal(nudgeModeFromEnv('send'), 'send');
});

test('parseAllowlist trims, lowercases and drops blanks', () => {
  assert.deepEqual(parseAllowlist(' A@x.test, ,b@x.test '), ['a@x.test', 'b@x.test']);
  assert.deepEqual(parseAllowlist(undefined), []);
});
