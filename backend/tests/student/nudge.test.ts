import test from 'node:test';
import assert from 'node:assert/strict';
import {
  decideNudge,
  isValidReminderTime,
  localMinutesInZone,
  nudgeEmail,
  type NudgeUser,
} from '../../src/modules/student/nudge.js';
import type { StudentEvent, StudentEventType } from '../../src/modules/student/studentFile.js';

const LA = 'America/Los_Angeles';

function user(overrides: Partial<NudgeUser> = {}): NudgeUser {
  return { reminderTime: '18:00', timeZone: LA, stopped: false, sprintDayCount: 14, ...overrides };
}

function ev(eventType: StudentEventType, localDate: string): StudentEvent {
  return {
    event_id: `evt_${eventType}_${localDate}`,
    user_id: 'user_1',
    event_type: eventType,
    local_date: localDate,
    occurred_at: `${localDate}T12:00:00.000Z`,
    payload: {},
  };
}

// 18:00 on 2026-11-15 in Los Angeles (PST, UTC-8).
const SIX_PM = new Date('2026-11-16T02:00:00Z');
const minutesAfter = (base: Date, minutes: number) => new Date(base.getTime() + minutes * 60_000);
const STARTED = [ev('plan_started', '2026-11-10')];

test('at the reminder time, with nothing done today: send', () => {
  assert.equal(decideNudge(SIX_PM, user(), STARTED), 'send');
});

test('the reminder time is on the user’s clock, not the server’s', () => {
  // The same instant is 02:00 for a UTC user: not their 18:00.
  assert.equal(decideNudge(SIX_PM, user({ timeZone: 'UTC' }), STARTED), 'none');
  assert.equal(decideNudge(new Date('2026-11-15T18:00:00Z'), user({ timeZone: 'UTC' }), STARTED), 'send');
});

test('window edges: not before, up to 60 minutes after, not later', () => {
  assert.equal(decideNudge(minutesAfter(SIX_PM, -1), user(), STARTED), 'none');
  assert.equal(decideNudge(minutesAfter(SIX_PM, 60), user(), STARTED), 'send');
  assert.equal(decideNudge(minutesAfter(SIX_PM, 61), user(), STARTED), 'none');
});

test('the window does not wrap past midnight onto the next date', () => {
  const late = user({ reminderTime: '23:30', timeZone: 'UTC' });
  assert.equal(decideNudge(new Date('2026-11-15T23:59:00Z'), late, STARTED), 'send');
  assert.equal(decideNudge(new Date('2026-11-16T00:10:00Z'), late, STARTED), 'none');
});

test('signed up after today’s reminder time: no nudge that day, normal the next', () => {
  // Plan started 18:20 local, reminder 18:00: still inside the 60-minute window.
  const started = [{ ...ev('plan_started', '2026-11-15'), occurred_at: '2026-11-16T02:20:00.000Z' }];
  assert.equal(decideNudge(minutesAfter(SIX_PM, 25), user(), started), 'none');
  assert.equal(decideNudge(minutesAfter(SIX_PM, 24 * 60), user(), started), 'send');
});

test('signed up earlier the same day: the nudge still goes out', () => {
  // Plan started 09:00 local.
  const started = [{ ...ev('plan_started', '2026-11-15'), occurred_at: '2026-11-15T17:00:00.000Z' }];
  assert.equal(decideNudge(SIX_PM, user(), started), 'send');
});

test('session already done today: skip', () => {
  const events = [...STARTED, ev('session_completed', '2026-11-15')];
  assert.equal(decideNudge(SIX_PM, user(), events), 'skip');
});

test('a session yesterday does not count as done today', () => {
  const events = [...STARTED, ev('session_completed', '2026-11-14')];
  assert.equal(decideNudge(SIX_PM, user(), events), 'send');
});

test('already sent or already skipped today: nothing more', () => {
  assert.equal(decideNudge(SIX_PM, user(), [...STARTED, ev('nudge_sent', '2026-11-15')]), 'none');
  const skipped = [...STARTED, ev('session_completed', '2026-11-15'), ev('nudge_skipped', '2026-11-15')];
  assert.equal(decideNudge(SIX_PM, user(), skipped), 'none');
});

test('yesterday’s nudge does not block today’s', () => {
  assert.equal(decideNudge(SIX_PM, user(), [...STARTED, ev('nudge_sent', '2026-11-14')]), 'send');
});

test('stopped, no reminder time, or no plan: none', () => {
  assert.equal(decideNudge(SIX_PM, user({ stopped: true }), STARTED), 'none');
  assert.equal(decideNudge(SIX_PM, user({ reminderTime: null }), STARTED), 'none');
  assert.equal(decideNudge(SIX_PM, user(), []), 'none');
});

test('finished sprint: none', () => {
  const events = [...STARTED, ev('session_completed', '2026-11-11'), ev('session_completed', '2026-11-12')];
  assert.equal(decideNudge(SIX_PM, user({ sprintDayCount: 2 }), events), 'none');
});

test('sessions from before a re-onboarding do not finish the new sprint', () => {
  const events = [
    ev('plan_started', '2026-11-01'),
    ev('session_completed', '2026-11-02'),
    ev('session_completed', '2026-11-03'),
    ev('plan_started', '2026-11-10'),
  ];
  assert.equal(decideNudge(SIX_PM, user({ sprintDayCount: 2 }), events), 'send');
});

test('spring forward: a 02:30 reminder that never happens goes out at 03:00', () => {
  // 2027-03-14 in Los Angeles: 01:59 PST is followed by 03:00 PDT.
  const u = user({ reminderTime: '02:30' });
  assert.equal(decideNudge(new Date('2027-03-14T09:59:00Z'), u, STARTED), 'none'); // 01:59 PST
  assert.equal(decideNudge(new Date('2027-03-14T10:00:00Z'), u, STARTED), 'send'); // 03:00 PDT
});

test('fall back: a 01:30 reminder that happens twice is sent once', () => {
  // 2027-11-07 in Los Angeles: 01:30 occurs in PDT, then again in PST.
  const u = user({ reminderTime: '01:30' });
  assert.equal(decideNudge(new Date('2027-11-07T08:30:00Z'), u, STARTED), 'send'); // 01:30 PDT
  const afterFirst = [...STARTED, ev('nudge_sent', '2027-11-07')];
  assert.equal(decideNudge(new Date('2027-11-07T09:30:00Z'), u, afterFirst), 'none'); // 01:30 PST
});

test('localMinutesInZone reads midnight as 0, not 24:00', () => {
  assert.equal(localMinutesInZone(new Date('2026-11-15T00:00:00Z'), 'UTC'), 0);
  assert.equal(localMinutesInZone(SIX_PM, LA), 18 * 60);
});

test('isValidReminderTime accepts HH:MM only', () => {
  for (const ok of ['00:00', '07:05', '18:30', '23:59']) assert.ok(isValidReminderTime(ok));
  for (const bad of ['24:00', '7:05', '18:60', '18:30:00', '', null, 1830]) {
    assert.ok(!isValidReminderTime(bad));
  }
});

test('the email is plain text with the app link and the stop link', () => {
  const email = nudgeEmail({ appUrl: 'https://app.example', stopUrl: 'https://app.example/#stop=tok' });
  assert.ok(email.subject.length > 0);
  assert.ok(email.text.includes('https://app.example\n'));
  assert.ok(email.text.includes('https://app.example/#stop=tok'));
  assert.ok(!email.text.includes('<'));
});

test('the HTML part links both texts to the right URLs and escapes them', () => {
  const email = nudgeEmail({ appUrl: 'https://app.example', stopUrl: 'https://app.example/?a=1&b="2"' });
  assert.ok(email.html.includes('<a href="https://app.example">Open it here</a>'));
  assert.ok(email.html.includes('<a href="https://app.example/?a=1&amp;b=&quot;2&quot;">click here</a>'));
});
