import { randomUUID } from 'node:crypto';
import {
  computeMissedDates,
  isValidTimeZone,
  localDateInZone,
  type StudentEvent,
  type StudentEventType,
} from './studentFile.js';

/** Satisfied by a pg Pool and by a pg client inside a transaction. */
export interface Queryable {
  query(
    sql: string,
    params?: unknown[],
  ): Promise<{ rows?: Array<Record<string, unknown>>; rowCount?: number | null }>;
}

export interface AppendEventInput {
  userId: string;
  eventType: StudentEventType;
  localDate: string;
  payload?: Record<string, unknown>;
}

/** Returns false when a once-a-day event already exists for that user and date. */
export async function appendEvent(db: Queryable, input: AppendEventInput): Promise<boolean> {
  const result = await db.query(
    `INSERT INTO pilot_student_events (event_id, user_id, event_type, local_date, payload_json)
     VALUES ($1, $2, $3, $4::date, $5::jsonb)
     ON CONFLICT DO NOTHING
     RETURNING event_id`,
    [
      `evt_${randomUUID()}`,
      input.userId,
      input.eventType,
      input.localDate,
      JSON.stringify(input.payload ?? {}),
    ],
  );
  return (result.rows?.length ?? 0) > 0;
}

export async function listEvents(db: Queryable, userId: string): Promise<StudentEvent[]> {
  // to_char: pg would otherwise turn DATE into a JS Date in the server's zone.
  const result = await db.query(
    `SELECT event_id, user_id, event_type,
            to_char(local_date, 'YYYY-MM-DD') AS local_date,
            occurred_at, payload_json
     FROM pilot_student_events
     WHERE user_id = $1
     ORDER BY local_date ASC, occurred_at ASC, event_id ASC`,
    [userId],
  );
  return (result.rows ?? []).map((row) => ({
    event_id: String(row.event_id),
    user_id: String(row.user_id),
    event_type: row.event_type as StudentEventType,
    local_date: String(row.local_date),
    occurred_at:
      row.occurred_at instanceof Date ? row.occurred_at.toISOString() : String(row.occurred_at),
    payload: (row.payload_json ?? {}) as Record<string, unknown>,
  }));
}

export interface StudentFile {
  timeZone: string;
  /** Today's date for this user. */
  today: string;
  events: StudentEvent[];
}

/**
 * Reads a user's file in order. Misses are not written when they happen (nothing
 * happens on a missed day), so this first records any that are due.
 */
export async function loadStudentFile(db: Queryable, userId: string, now: Date): Promise<StudentFile> {
  const context = await db.query(
    `SELECT u.time_zone, p.sprint_day_count
     FROM pilot_users u
     LEFT JOIN pilot_plans p ON p.user_id = u.user_id
     WHERE u.user_id = $1`,
    [userId],
  );
  const row = context.rows?.[0] ?? {};
  const timeZone = isValidTimeZone(row.time_zone) ? row.time_zone : 'UTC';
  const today = localDateInZone(now, timeZone);

  let events = await listEvents(db, userId);
  const missed = computeMissedDates(events, today, Number(row.sprint_day_count ?? 14));
  if (missed.length > 0) {
    for (const localDate of missed) {
      await appendEvent(db, { userId, eventType: 'session_missed', localDate });
    }
    events = await listEvents(db, userId);
  }
  return { timeZone, today, events };
}
