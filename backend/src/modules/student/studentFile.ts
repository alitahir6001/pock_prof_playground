export const STUDENT_EVENT_TYPES = [
  'plan_started',
  'session_completed',
  'session_missed',
  'comeback_checkin',
  'nudge_sent',
  'nudge_skipped',
  'nudge_failed',
  'nudge_stopped',
] as const;

export type StudentEventType = (typeof STUDENT_EVENT_TYPES)[number];

export interface StudentEvent {
  event_id: string;
  user_id: string;
  event_type: StudentEventType;
  /** YYYY-MM-DD in the user's time zone. */
  local_date: string;
  occurred_at: string;
  payload: Record<string, unknown>;
}

export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== 'string' || value.length < 1 || value.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** The calendar day (YYYY-MM-DD) that `instant` falls on for someone in `timeZone`. */
export function localDateInZone(instant: Date, timeZone: string): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

export function addDays(localDate: string, days: number): string {
  const d = new Date(`${localDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Days that should be recorded as missed but are not yet. A miss is a full day
 * after the plan started, before today, with no completed session. The start
 * day and today never count. `events` must be in student-file order.
 */
export function computeMissedDates(
  events: StudentEvent[],
  today: string,
  sprintDayCount: number,
): string[] {
  let startIndex = -1;
  events.forEach((e, i) => {
    if (e.event_type === 'plan_started') startIndex = i;
  });
  if (startIndex < 0) return [];

  const start = events[startIndex].local_date;
  const completed = events
    .slice(startIndex + 1)
    .filter((e) => e.event_type === 'session_completed')
    .map((e) => e.local_date);
  const done = new Set(completed);
  const recorded = new Set(
    events.filter((e) => e.event_type === 'session_missed').map((e) => e.local_date),
  );

  // A finished sprint stops accruing misses at its last session.
  const finished = completed.length >= sprintDayCount;
  const end = finished ? completed[completed.length - 1] : today;

  const missed: string[] = [];
  for (let d = addDays(start, 1); d < end; d = addDays(d, 1)) {
    if (!done.has(d) && !recorded.has(d)) missed.push(d);
  }
  return missed;
}
