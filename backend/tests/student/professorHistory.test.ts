import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProfessorHistory } from '../../src/modules/student/professorHistory.js';
import type { StudentEvent, StudentEventType } from '../../src/modules/student/studentFile.js';

function ev(eventType: StudentEventType, localDate: string, payload: Record<string, unknown> = {}): StudentEvent {
  return {
    event_id: `evt_${eventType}_${localDate}`,
    user_id: 'user_1',
    event_type: eventType,
    local_date: localDate,
    occurred_at: `${localDate}T12:00:00.000Z`,
    payload,
  };
}

test('buildProfessorHistory lists sessions and misses with how long ago they were', () => {
  const events = [
    ev('plan_started', '2026-11-10'),
    ev('session_completed', '2026-11-11', { task_summary: 'Ran ipconfig /all' }),
    ev('session_missed', '2026-11-12'),
    ev('nudge_sent', '2026-11-12'),
    ev('session_completed', '2026-11-14', { task_summary: 'Matched cable connectors' }),
  ];
  assert.deepEqual(buildProfessorHistory(events, '2026-11-15'), [
    { date: '2026-11-11', days_ago: 4, what: 'completed', task_summary: 'Ran ipconfig /all' },
    { date: '2026-11-12', days_ago: 3, what: 'missed' },
    { date: '2026-11-14', days_ago: 1, what: 'completed', task_summary: 'Matched cable connectors' },
  ]);
});

test('buildProfessorHistory drops anything older than the window', () => {
  const events = [
    ev('session_completed', '2026-10-01', { task_summary: 'Old' }),
    ev('session_completed', '2026-11-01', { task_summary: 'Edge' }),
  ];
  assert.deepEqual(buildProfessorHistory(events, '2026-11-15'), [
    { date: '2026-11-01', days_ago: 14, what: 'completed', task_summary: 'Edge' },
  ]);
});

test('buildProfessorHistory is empty for a brand-new student', () => {
  assert.deepEqual(buildProfessorHistory([ev('plan_started', '2026-11-15')], '2026-11-15'), []);
});
