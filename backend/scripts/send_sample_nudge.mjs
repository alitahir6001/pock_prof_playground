// Sends ONE sample nudge to the address given: the day-0 inbox check from
// .ai/pilot-test-design.md. Same sender and template as the real reminder.
// Writes nothing to the database; the stop link in a sample does nothing.
//   node --env-file=../.env scripts/send_sample_nudge.mjs someone@example.com
import { emailConfigFromEnv, sendEmail } from '../dist/src/modules/email/sendEmail.js';
import { nudgeEmail } from '../dist/src/modules/student/nudge.js';
import { stopUrl } from '../dist/src/modules/student/nudgeRunner.js';

const to = String(process.argv[2] || '').trim().toLowerCase();
if (!to.includes('@')) {
  console.error('Usage: node scripts/send_sample_nudge.mjs <email>');
  process.exit(1);
}

const origin = process.env.FRONTEND_ORIGIN || '';
const appUrl = origin && origin !== '*' ? origin : 'http://localhost:5173';
const message = nudgeEmail({ appUrl, stopUrl: stopUrl(appUrl, 'sample') });

await sendEmail(emailConfigFromEnv(process.env), { to, ...message });
console.log(`Sample nudge sent to ${to} (app link: ${appUrl}).`);
