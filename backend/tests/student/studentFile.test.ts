import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  computeMissedDates,
  isValidTimeZone,
  localDateInZone,
  type StudentEvent,
  type StudentEventType,
} from '../../src/modules/student/studentFile.js';

let seq = 0;
function ev(eventType: StudentEventType, localDate: string): StudentEvent {
  seq += 1;
  return {
    event_id: `evt_${seq}`,
    user_id: 'user_1',
    event_type: eventType,
    local_date: localDate,
    occurred_at: `${localDate}T12:00:00.000Z`,
    payload: {},
  };
}

test('localDateInZone: the same instant is a different day in different zones', () => {
  const instant = new Date('2026-11-15T03:30:00Z');
  assert.equal(localDateInZone(instant, 'UTC'), '2026-11-15');
  assert.equal(localDateInZone(instant, 'America/Los_Angeles'), '2026-11-14');
  assert.equal(localDateInZone(instant, 'Asia/Tokyo'), '2026-11-15');
});

test('localDateInZone: correct on both sides of a daylight-saving change', () => {
  // US clocks went back on 2026-11-01. 07:30Z is 00:30 PDT the day before, 23:30 PST after.
  assert.equal(localDateInZone(new Date('2026-10-31T07:30:00Z'), 'America/Los_Angeles'), '2026-10-31');
  assert.equal(localDateInZone(new Date('2026-11-02T07:30:00Z'), 'America/Los_Angeles'), '2026-11-01');
});

test('isValidTimeZone accepts IANA names and rejects junk', () => {
  assert.equal(isValidTimeZone('America/New_York'), true);
  assert.equal(isValidTimeZone('Not/AZone'), false);
  assert.equal(isValidTimeZone(''), false);
  assert.equal(isValidTimeZone(undefined), false);
});

test('addDays crosses month and year ends', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
});

test('computeMissedDates: no plan means no misses', () => {
  assert.deepEqual(computeMissedDates([], '2026-11-15', 14), []);
});

test('computeMissedDates: a session every day leaves nothing missed', () => {
  const events = [
    ev('plan_started', '2026-11-10'),
    ev('session_completed', '2026-11-10'),
    ev('session_completed', '2026-11-11'),
    ev('session_completed', '2026-11-12'),
  ];
  assert.deepEqual(computeMissedDates(events, '2026-11-13', 14), []);
});

test('computeMissedDates: gaps are missed; the start day and today are not', () => {
  const events = [
    ev('plan_started', '2026-11-10'),
    ev('session_completed', '2026-11-11'),
    ev('session_completed', '2026-11-14'),
  ];
  // 11-10 is the start day (no session, not a miss). 11-15 is today.
  assert.deepEqual(computeMissedDates(events, '2026-11-15', 14), ['2026-11-12', '2026-11-13']);
});

test('computeMissedDates: already-recorded misses are not returned again', () => {
  const events = [
    ev('plan_started', '2026-11-10'),
    ev('session_missed', '2026-11-11'),
  ];
  assert.deepEqual(computeMissedDates(events, '2026-11-13', 14), ['2026-11-12']);
});

test('computeMissedDates: re-onboarding restarts the count from the new plan', () => {
  const events = [
    ev('plan_started', '2026-11-01'),
    ev('session_completed', '2026-11-02'),
    ev('plan_started', '2026-11-12'),
  ];
  assert.deepEqual(computeMissedDates(events, '2026-11-15', 14), ['2026-11-13', '2026-11-14']);
});

test('computeMissedDates: a finished sprint stops accruing misses', () => {
  const events = [
    ev('plan_started', '2026-11-01'),
    ev('session_completed', '2026-11-02'),
    ev('session_completed', '2026-11-04'),
  ];
  // Sprint of 2 sessions finished on 11-04; 11-03 was missed, nothing after counts.
  assert.deepEqual(computeMissedDates(events, '2026-11-15', 2), ['2026-11-03']);
});
