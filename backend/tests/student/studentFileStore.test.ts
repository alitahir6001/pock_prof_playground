import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendEvent,
  listEvents,
  loadStudentFile,
  type Queryable,
} from '../../src/modules/student/studentFileStore.js';

type Row = Record<string, unknown>;

const DAILY = ['session_missed', 'comeback_checkin', 'nudge_sent', 'nudge_skipped'];

/** In-memory stand-in for the three statements the store issues. */
function fakeDb(user: Row, seed: Row[] = []) {
  const rows: Row[] = [...seed];
  const sql: string[] = [];
  let tick = 0;
  const db: Queryable = {
    async query(text: string, params: unknown[] = []) {
      sql.push(text);
      if (text.includes('FROM pilot_users')) return { rows: [user] };
      if (text.includes('INSERT INTO pilot_student_events')) {
        const [eventId, userId, eventType, localDate, payload] = params as string[];
        const clash = rows.some(
          (r) => DAILY.includes(eventType) && r.event_type === eventType && r.local_date === localDate,
        );
        if (clash) return { rows: [] };
        tick += 1;
        rows.push({
          event_id: eventId,
          user_id: userId,
          event_type: eventType,
          local_date: localDate,
          occurred_at: new Date(Date.UTC(2026, 10, 20, 0, 0, tick)),
          payload_json: JSON.parse(payload),
        });
        return { rows: [{ event_id: eventId }] };
      }
      const sorted = [...rows].sort((a, b) =>
        `${a.local_date}|${(a.occurred_at as Date).toISOString()}`.localeCompare(
          `${b.local_date}|${(b.occurred_at as Date).toISOString()}`,
        ),
      );
      return { rows: sorted };
    },
  };
  return { db, rows, sql };
}

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

test('listEvents asks the database for student-file order and maps rows', async () => {
  const { db, sql } = fakeDb({}, [seedRow('plan_started', '2026-11-10')]);
  const events = await listEvents(db, 'user_1');
  assert.ok(sql[0].includes('ORDER BY local_date ASC, occurred_at ASC'));
  assert.deepEqual(events[0], {
    event_id: 'evt_seed_plan_started_2026-11-10',
    user_id: 'user_1',
    event_type: 'plan_started',
    local_date: '2026-11-10',
    occurred_at: '2026-11-10T12:00:00.000Z',
    payload: {},
  });
});

test('appendEvent reports whether the row was written', async () => {
  const { db } = fakeDb({});
  const input = { userId: 'user_1', eventType: 'nudge_sent' as const, localDate: '2026-11-15' };
  assert.equal(await appendEvent(db, input), true);
  assert.equal(await appendEvent(db, input), false);
});

test('loadStudentFile records due misses and returns sessions and misses in order', async () => {
  const { db } = fakeDb({ time_zone: 'America/Los_Angeles', sprint_day_count: 14 }, [
    seedRow('plan_started', '2026-11-10'),
    seedRow('session_completed', '2026-11-11'),
    seedRow('session_completed', '2026-11-14'),
  ]);
  // 2026-11-16T02:00Z is still 11-15 in Los Angeles.
  const file = await loadStudentFile(db, 'user_1', new Date('2026-11-16T02:00:00Z'));
  assert.equal(file.timeZone, 'America/Los_Angeles');
  assert.equal(file.today, '2026-11-15');
  assert.deepEqual(
    file.events.map((e) => `${e.local_date} ${e.event_type}`),
    [
      '2026-11-10 plan_started',
      '2026-11-11 session_completed',
      '2026-11-12 session_missed',
      '2026-11-13 session_missed',
      '2026-11-14 session_completed',
    ],
  );
});

test('loadStudentFile is idempotent: a second read writes nothing new', async () => {
  const { db, rows } = fakeDb({ time_zone: null, sprint_day_count: 14 }, [
    seedRow('plan_started', '2026-11-10'),
  ]);
  const now = new Date('2026-11-13T09:00:00Z');
  const first = await loadStudentFile(db, 'user_1', now);
  const countAfterFirst = rows.length;
  await loadStudentFile(db, 'user_1', now);
  assert.equal(first.timeZone, 'UTC');
  assert.equal(countAfterFirst, 3);
  assert.equal(rows.length, 3);
});
