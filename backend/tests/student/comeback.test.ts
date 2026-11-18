import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { evaluateComeback, fitLessonToMinutes } from '../../src/modules/student/comeback.js';
import { addDays, type StudentEvent, type StudentEventType } from '../../src/modules/student/studentFile.js';

const TODAY = '2026-11-15';

function ev(eventType: StudentEventType, daysAgo: number): StudentEvent {
  const localDate = addDays(TODAY, -daysAgo);
  return {
    event_id: `evt_${eventType}_${localDate}`,
    user_id: 'user_1',
    event_type: eventType,
    local_date: localDate,
    occurred_at: `${localDate}T12:00:00.000Z`,
    payload: {},
  };
}

test('no missed days: an ordinary day', () => {
  const events = [ev('plan_started', 3), ev('session_completed', 2), ev('session_completed', 1)];
  assert.equal(evaluateComeback(events, TODAY, 20), null);
});

test('one missed day is not a comeback', () => {
  const events = [ev('plan_started', 3), ev('session_completed', 2), ev('session_missed', 1)];
  assert.equal(evaluateComeback(events, TODAY, 20), null);
});

test('two missed days in a row: 25% shorter, from the engine rule, with a note', () => {
  const events = [ev('plan_started', 4), ev('session_completed', 3), ev('session_missed', 2), ev('session_missed', 1)];
  const comeback = evaluateComeback(events, TODAY, 20);
  assert.ok(comeback);
  assert.equal(comeback?.missed_days, 2);
  assert.equal(comeback?.minutes, 15);
  assert.equal(comeback?.full_minutes, 20);
  assert.equal(comeback?.rule_id, 'R_MISSED_2_IN_7D_REDUCE_WORKLOAD_25');
  assert.ok(comeback?.note.includes('about 15 minutes'));
});

test('five missed days in a row counts all five', () => {
  const events = [ev('plan_started', 6), ...[5, 4, 3, 2, 1].map((d) => ev('session_missed', d))];
  assert.equal(evaluateComeback(events, TODAY, 20)?.missed_days, 5);
});

test('misses earlier in the week but a session yesterday: not a comeback', () => {
  const events = [ev('plan_started', 5), ev('session_missed', 4), ev('session_missed', 3), ev('session_completed', 1), ev('session_missed', 2)];
  assert.equal(evaluateComeback(events, TODAY, 20), null);
});

test('first day back only: once a session is done today, the comeback is over', () => {
  const events = [ev('plan_started', 4), ev('session_missed', 2), ev('session_missed', 1), ev('session_completed', 0)];
  assert.equal(evaluateComeback(events, TODAY, 20), null);
});

test('a session never drops below 10 minutes', () => {
  const events = [ev('plan_started', 4), ev('session_missed', 2), ev('session_missed', 1)];
  assert.equal(evaluateComeback(events, TODAY, 10)?.minutes, 10);
  assert.equal(evaluateComeback(events, TODAY, 40)?.minutes, 30);
});

test('canned lesson on a comeback day: headline and task estimates fit the shorter session', () => {
  const lesson = {
    session_objective: 'Complete one micro-proof in 20 minutes.',
    options: [
      { option_id: 'a', estimated_minutes: 20 },
      { option_id: 'b', estimated_minutes: 10 },
    ],
    recall_note: null,
  };
  const fitted = fitLessonToMinutes(lesson, 15);
  assert.equal(fitted.session_objective, 'Complete one micro-proof in 15 minutes.');
  assert.deepEqual(fitted.options, [
    { option_id: 'a', estimated_minutes: 15 },
    { option_id: 'b', estimated_minutes: 10 },
  ]);
  assert.equal(fitted.recall_note, null);
  // The input is not changed.
  assert.equal(lesson.session_objective, 'Complete one micro-proof in 20 minutes.');
});

test('the real canned Professor lesson has its 20 minutes rewritten', () => {
  // example_output.json lives under src/ (not compiled into dist).
  const url = new URL('../../../src/modules/agents/phase2/professor-agent/example_output.json', import.meta.url);
  const lesson = JSON.parse(readFileSync(fileURLToPath(url), 'utf8'));
  assert.ok(/20 minutes/.test(lesson.session_objective));
  const fitted = fitLessonToMinutes(lesson, 15);
  assert.ok(!/20 minutes/.test(String(fitted.session_objective)));
  assert.ok(/15 minutes/.test(String(fitted.session_objective)));
});
