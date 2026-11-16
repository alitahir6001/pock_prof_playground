import { decideNudge, isInNudgeWindow, isValidReminderTime, nudgeEmail } from './nudge.js';
import { isValidTimeZone } from './studentFile.js';
import { appendEvent, loadStudentFile, type Queryable } from './studentFileStore.js';

export type NudgeMode = 'log' | 'send';

export interface NudgeRunnerDeps {
  /** 'log' writes the event but sends nothing. Anything but an explicit 'send' is 'log'. */
  mode: NudgeMode;
  /** Lowercased addresses. Empty = everyone; otherwise only these get real mail. */
  allowlist: string[];
  appUrl: string;
  sendEmail(message: { to: string; subject: string; text: string }): Promise<void>;
  log(info: Record<string, unknown>, message: string): void;
}

export function nudgeModeFromEnv(value: string | undefined): NudgeMode {
  return value === 'send' ? 'send' : 'log';
}

export function parseAllowlist(value: string | undefined): string[] {
  return (value || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
}

export function stopUrl(appUrl: string, token: string): string {
  return `${appUrl}/#stop=${token}`;
}

/** One pass over every user with a reminder set. Safe to run as often as you like. */
export async function runNudgeTick(db: Queryable, now: Date, deps: NudgeRunnerDeps): Promise<void> {
  const due = await db.query(
    `SELECT u.user_id, u.email, u.time_zone, u.nudge_stop_token,
            to_char(u.reminder_time, 'HH24:MI') AS reminder_time,
            p.sprint_day_count
     FROM pilot_users u
     JOIN pilot_plans p ON p.user_id = u.user_id
     WHERE u.reminder_time IS NOT NULL AND u.nudges_stopped_at IS NULL`,
  );

  for (const row of due.rows ?? []) {
    const userId = String(row.user_id);
    try {
      const reminderTime = row.reminder_time;
      const timeZone = isValidTimeZone(row.time_zone) ? row.time_zone : 'UTC';
      // Cheap check first, so a student file is only read during its one hour a day.
      if (!isValidReminderTime(reminderTime) || !isInNudgeWindow(now, reminderTime, timeZone)) continue;

      const file = await loadStudentFile(db, userId, now);
      const decision = decideNudge(
        now,
        { reminderTime, timeZone, stopped: false, sprintDayCount: Number(row.sprint_day_count ?? 14) },
        file.events,
      );
      if (decision === 'none') continue;

      if (decision === 'skip') {
        await appendEvent(db, {
          userId,
          eventType: 'nudge_skipped',
          localDate: file.today,
          payload: { reason: 'done_today', reminder_time: reminderTime },
        });
        deps.log({ userId }, 'Nudge skipped: session already done today');
        continue;
      }

      const email = String(row.email).toLowerCase();
      const allowed = deps.allowlist.length === 0 || deps.allowlist.includes(email);
      const reallySend = deps.mode === 'send' && allowed;

      // Record first: the unique index rejects a second nudge_sent for the same
      // day, and nothing is emailed unless this insert went in.
      const recorded = await appendEvent(db, {
        userId,
        eventType: 'nudge_sent',
        localDate: file.today,
        payload: {
          reminder_time: reminderTime,
          dry_run: !reallySend,
          ...(reallySend ? {} : { dry_run_reason: deps.mode === 'send' ? 'not_on_allowlist' : 'log_mode' }),
        },
      });
      if (!recorded) continue;

      if (!reallySend) {
        deps.log({ userId, mode: deps.mode }, 'Nudge recorded as a dry run; no email sent');
        continue;
      }

      try {
        const message = nudgeEmail({
          appUrl: deps.appUrl,
          stopUrl: stopUrl(deps.appUrl, String(row.nudge_stop_token)),
        });
        await deps.sendEmail({ to: email, ...message });
        deps.log({ userId }, 'Nudge sent');
      } catch (error) {
        // No retry: the nudge_sent row stays, so today is spent.
        await appendEvent(db, {
          userId,
          eventType: 'nudge_failed',
          localDate: file.today,
          payload: { error: String(error instanceof Error ? error.message : error).slice(0, 300) },
        });
        deps.log({ userId, err: String(error) }, 'Nudge email failed; not retrying today');
      }
    } catch (error) {
      // One user's failure must not stop the others.
      deps.log({ userId, err: String(error) }, 'Nudge check failed for user');
    }
  }
}
