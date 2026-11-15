import { evaluatePolicies, RULE_IDS } from '../adaptation/phase3/policyEngine.js';
import { addDays, type StudentEvent } from './studentFile.js';

/** Missed days in a row, right before today, that make a return a "comeback". */
export const COMEBACK_MIN_MISSED_DAYS = 2;
const MIN_SESSION_MINUTES = 10;

export interface Comeback {
  missed_days: number;
  minutes: number;
  full_minutes: number;
  rule_id: string;
  note: string;
}

// Fixed wording, frozen for the n=3 test (.ai/vision.md: a variable under test).
export function comebackNote(minutes: number): string {
  return `You've been away a few days. That happens, and there's nothing to catch up on. Today is a shorter one: about ${minutes} minutes.`;
}

/**
 * The gap decides WHEN (first session back after 2+ missed days in a row);
 * the adaptation engine's missed-session rule decides HOW MUCH shorter.
 * Returns null on an ordinary day. `events` must have misses already recorded.
 */
export function evaluateComeback(
  events: StudentEvent[],
  today: string,
  baseMinutes: number,
  userId = 'unknown',
): Comeback | null {
  const completedToday = events.some((e) => e.event_type === 'session_completed' && e.local_date === today);
  if (completedToday) return null;

  const missed = new Set(events.filter((e) => e.event_type === 'session_missed').map((e) => e.local_date));
  let missedInARow = 0;
  for (let d = addDays(today, -1); missed.has(d); d = addDays(d, -1)) missedInARow += 1;
  if (missedInARow < COMEBACK_MIN_MISSED_DAYS) return null;

  const weekAgo = addDays(today, -7);
  const missedLast7Days = [...missed].filter((d) => d >= weekAgo && d < today).length;

  const policy = evaluatePolicies({
    user_id: userId,
    evaluated_at: `${today}T00:00:00.000Z`,
    weekly_structural_mutations_applied: 0,
    // Only the missed-session rule is wired (ADR-0025); the other signals stay off.
    counters: {
      missed_sessions_7d: missedLast7Days,
      late_night_sessions_7d: 0,
      topic_resistance_triggered: false,
      pivot_interest_triggered: false,
      consecutive_completed_sessions: 0,
    },
  });
  const mutation = policy.mutations.find((m) => m.rule_id === RULE_IDS.MISSED_2_IN_7D);
  const delta = Number(mutation?.mutation_applied.workload_delta_percent);
  if (!mutation || !Number.isFinite(delta)) return null;

  const reduced = Math.round((baseMinutes * (1 + delta / 100)) / 5) * 5;
  const minutes = Math.max(MIN_SESSION_MINUTES, reduced);
  return {
    missed_days: missedInARow,
    minutes,
    full_minutes: baseMinutes,
    rule_id: mutation.rule_id,
    note: comebackNote(minutes),
  };
}
