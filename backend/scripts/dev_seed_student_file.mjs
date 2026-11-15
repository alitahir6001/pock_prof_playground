// LOCAL DEV ONLY. Creates (or recreates) one seed user with a backdated history,
// so the student file can be checked without waiting days:
// plan started 5 days ago; sessions 5, 4 and 1 days ago; nothing 3 and 2 days ago.
import { randomUUID } from 'node:crypto';
import { addDays, localDateInZone } from '../dist/src/modules/student/studentFile.js';

if (process.env.NODE_ENV === 'production') {
  throw new Error('dev_seed_student_file refuses to run in production.');
}
const databaseUrl = process.env.ADAPTATION_DATABASE_URL || process.env.DATABASE_URL || '';
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(databaseUrl)) {
  throw new Error('dev_seed_student_file only runs against a localhost database.');
}

const EMAIL = 'seed-student-file@example.test';
const ZONE = 'America/Los_Angeles';
// `node dev_seed_student_file.mjs comeback` leaves the last two days empty instead,
// so the user is returning after 2 missed days in a row.
const lastSessionDaysAgo = process.argv[2] === 'comeback' ? 3 : 1;
const SESSIONS = [
  { daysAgo: 5, summary: 'Watched Messer 1.1 and listed the three laptop display types' },
  { daysAgo: 4, summary: 'Ran ipconfig /all and found the default gateway' },
  { daysAgo: lastSessionDaysAgo, summary: 'Matched six cable connectors to their names' },
];

const pool = new (await import('pg')).Pool({ connectionString: databaseUrl });
const today = localDateInZone(new Date(), ZONE);
// 19:00/20:00 UTC is midday in ZONE, so the timestamp sits inside its local date.
const at = (daysAgo, hour = 20) => `${addDays(today, -daysAgo)}T${hour}:00:00Z`;

await pool.query('DELETE FROM pilot_users WHERE email = $1', [EMAIL]);
const userId = `user_${randomUUID()}`;
const planId = `plan_${randomUUID()}`;
await pool.query('INSERT INTO pilot_users (user_id, email, time_zone) VALUES ($1, $2, $3)', [userId, EMAIL, ZONE]);
await pool.query(
  `INSERT INTO pilot_plans (plan_id, user_id, plan_json, active_track_id, created_at)
   VALUES ($1, $2, $3::jsonb, 'it_support', $4)`,
  [planId, userId, JSON.stringify({ active_track_id: 'it_support', sprint: { daily_minutes_target: 20 } }), at(5)],
);

const event = (type, daysAgo, payload = {}, hour = 20) =>
  pool.query(
    `INSERT INTO pilot_student_events (event_id, user_id, event_type, local_date, occurred_at, payload_json)
     VALUES ($1, $2, $3, $4::date, $5, $6::jsonb)`,
    [`evt_${randomUUID()}`, userId, type, addDays(today, -daysAgo), at(daysAgo, hour), JSON.stringify(payload)],
  );

// An hour before the day-1 session, so the plan sorts first.
await event('plan_started', 5, { plan_id: planId }, 19);
for (const [i, s] of SESSIONS.entries()) {
  await pool.query(
    `INSERT INTO pilot_sprint_days (day_id, user_id, plan_id, day_index, track_id, task_summary, completed_at)
     VALUES ($1, $2, $3, $4, 'it_support', $5, $6)`,
    [`day_${randomUUID()}`, userId, planId, i + 1, s.summary, at(s.daysAgo)],
  );
  await event('session_completed', s.daysAgo, { day_index: i + 1, track_id: 'it_support', task_summary: s.summary });
}

console.log(`Seeded ${EMAIL} (${ZONE}); today for them is ${today}.`);
await pool.end();
