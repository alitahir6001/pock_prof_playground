import { localDateInZone, type StudentEvent } from './studentFile.js';

/** How long after the reminder time a nudge may still go out (covers a server restart). */
export const NUDGE_WINDOW_MINUTES = 60;

export interface NudgeUser {
  /** "HH:MM" on the user's own clock, or null when none is set. */
  reminderTime: string | null;
  timeZone: string;
  stopped: boolean;
  sprintDayCount: number;
}

/** send = email them now; skip = due, but today's session is already done; none = do nothing. */
export type NudgeDecision = 'send' | 'skip' | 'none';

export function isValidReminderTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/** Minutes since midnight on the wall clock of someone in `timeZone`. */
export function localMinutesInZone(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const part = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return part('hour') * 60 + part('minute');
}

/**
 * True from the reminder time until NUDGE_WINDOW_MINUTES after it. The window
 * deliberately does not wrap past midnight: a late nudge must never land on the next date.
 */
export function isInNudgeWindow(now: Date, reminderTime: string, timeZone: string): boolean {
  const [h, m] = reminderTime.split(':').map(Number);
  const late = localMinutesInZone(now, timeZone) - (h * 60 + m);
  return late >= 0 && late <= NUDGE_WINDOW_MINUTES;
}

/** `events` is the user's student file in order. */
export function decideNudge(now: Date, user: NudgeUser, events: StudentEvent[]): NudgeDecision {
  if (user.stopped || !isValidReminderTime(user.reminderTime)) return 'none';
  if (!isInNudgeWindow(now, user.reminderTime, user.timeZone)) return 'none';

  const today = localDateInZone(now, user.timeZone);
  const handledToday = events.some(
    (e) => e.local_date === today && (e.event_type === 'nudge_sent' || e.event_type === 'nudge_skipped'),
  );
  if (handledToday) return 'none';

  let startIndex = -1;
  events.forEach((e, i) => {
    if (e.event_type === 'plan_started') startIndex = i;
  });
  if (startIndex < 0) return 'none';

  const completed = events.slice(startIndex + 1).filter((e) => e.event_type === 'session_completed');
  if (completed.some((e) => e.local_date === today)) return 'skip';
  // A finished sprint has nothing left to be reminded about.
  if (completed.length >= user.sprintDayCount) return 'none';
  return 'send';
}

// Fixed wording, frozen for the n=3 test (.ai/pilot-test-design.md: a variable under test).
export function nudgeEmail(links: { appUrl: string; stopUrl: string }): { subject: string; text: string } {
  return {
    subject: "Today's session is ready",
    text: [
      "It's the time you picked for today's session.",
      '',
      'One small task is waiting. It takes about as long as you planned for.',
      '',
      `Open it: ${links.appUrl}`,
      '',
      `Stop these reminders: ${links.stopUrl}`,
    ].join('\n'),
  };
}
