import type { StudentEvent } from './studentFile.js';

export interface ProfessorHistoryEntry {
  date: string;
  days_ago: number;
  what: 'completed' | 'missed';
  task_summary?: string;
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** What the Professor is shown of the student file: recent sessions and misses, oldest first. */
export function buildProfessorHistory(
  events: StudentEvent[],
  today: string,
  windowDays = 14,
): ProfessorHistoryEntry[] {
  const history: ProfessorHistoryEntry[] = [];
  for (const e of events) {
    if (e.event_type !== 'session_completed' && e.event_type !== 'session_missed') continue;
    const daysAgo = daysBetween(e.local_date, today);
    if (daysAgo < 0 || daysAgo > windowDays) continue;
    if (e.event_type === 'session_missed') {
      history.push({ date: e.local_date, days_ago: daysAgo, what: 'missed' });
    } else {
      const summary = typeof e.payload.task_summary === 'string' ? e.payload.task_summary : undefined;
      history.push({
        date: e.local_date,
        days_ago: daysAgo,
        what: 'completed',
        ...(summary ? { task_summary: summary } : {}),
      });
    }
  }
  return history;
}
