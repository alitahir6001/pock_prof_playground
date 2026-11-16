import React, { useState, useEffect } from 'react';
import OnboardingFlow from './onboarding/OnboardingFlow';
import { PrimaryButton } from './onboarding/components/Button';
import { ReminderTimeField } from './onboarding/steps/Trigger';
import { agents, submitFeedback, planApi, settingsApi, nudgeApi } from './onboarding/api';
import { CAREER_OPTIONS, RATIONALE_LABEL, RISK_FLAGS } from './onboarding/data';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'pilot_session_token';

async function api(path, method, body, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload.ok === false) {
    throw new Error(payload.detail || payload.error_code || `HTTP ${res.status}`);
  }
  return payload;
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-paper-0 text-ink-0 font-sans">
      <div className="mx-auto max-w-[440px] px-5 pt-6 pb-10">{children}</div>
    </div>
  );
}

// ── Feedback control. With `onRefine`, thumbs-down opens a "what didn't fit?"
//    prompt that REGENERATES the plan; without it, thumbs-down just records. ──
function Feedback({ component, interactionId, prompt = 'Was this helpful?', onRefine }) {
  const [stage, setStage] = useState('ask'); // ask | comment | refine | done
  const [helpful, setHelpful] = useState(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [redoing, setRedoing] = useState(false);

  async function save(value, text) {
    setBusy(true);
    try {
      await submitFeedback({ component, interaction_id: interactionId || null, helpful: value, comment: text || null });
    } catch {
      // feedback is non-blocking; never trap the user on a failed save
    } finally {
      setBusy(false);
    }
  }

  // One tap records the rating; the comment is a separate, optional second step.
  async function rate(value) {
    if (!value && onRefine) {
      setStage('refine');
      return;
    }
    setHelpful(value);
    await save(value);
    setStage('comment');
  }

  async function sendComment() {
    await save(helpful, comment);
    setStage('done');
  }

  async function redo() {
    setRedoing(true); // stays true until the refreshed plan remounts this control
    await save(false, comment);
    onRefine(comment);
  }

  if (stage === 'done') {
    return <div className="rounded-2xl bg-paper-2 border border-paper-edge p-4 text-[13px] text-ink-2">Thanks — that helps us tune it.</div>;
  }

  if (stage === 'comment') {
    return (
      <div className="rounded-2xl bg-paper-1 border border-paper-edge p-4">
        <div className="text-[14px] text-ink-1 mb-2 leading-[1.5]">Thanks. Anything to add?</div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          placeholder="Optional"
          className="w-full rounded-xl bg-paper-0 border border-paper-edge px-3 py-2 text-[13px] text-ink-0 mb-3 focus:outline-none focus:border-accent"
        />
        <button disabled={busy || !comment.trim()} onClick={sendComment} className="rounded-full border border-paper-edge px-4 py-2 text-[14px] hover:border-accent hover:text-accent disabled:opacity-50">Send</button>
      </div>
    );
  }

  if (stage === 'refine') {
    return (
      <div className="rounded-2xl bg-paper-1 border border-paper-edge p-4">
        <div className="text-[14px] text-ink-1 mb-2 leading-[1.5]">No worries — what didn't fit? Tell me and I'll take another pass.</div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          placeholder="e.g. too much desk work, or none of these feel like me"
          className="w-full rounded-xl bg-paper-0 border border-paper-edge px-3 py-2 text-[13px] text-ink-0 mb-3 focus:outline-none focus:border-accent"
        />
        <div className="flex gap-2">
          <button disabled={busy || redoing} onClick={redo} className="flex-1 rounded-full bg-ink-0 text-paper-0 py-2 text-[14px] hover:bg-accent-deep disabled:opacity-50">
            {redoing ? 'Reworking your plan…' : 'Redo my plan'}
          </button>
          {!redoing && (
            <button disabled={busy} onClick={() => setStage('done')} className="rounded-full border border-paper-edge px-4 py-2 text-[14px] text-ink-2 hover:text-ink-0">It's fine, actually</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-paper-1 border border-paper-edge p-4">
      <div className="font-mono text-[11px] uppercase tracking-wider text-ink-2 mb-2">{prompt}</div>
      <div className="flex gap-2">
        <button disabled={busy} onClick={() => rate(true)} className="flex-1 rounded-full border border-paper-edge py-2 text-[14px] hover:border-accent hover:text-accent disabled:opacity-50">👍 Helpful</button>
        <button disabled={busy} onClick={() => rate(false)} className="flex-1 rounded-full border border-paper-edge py-2 text-[14px] hover:border-accent hover:text-accent disabled:opacity-50">👎 Not really</button>
      </div>
    </div>
  );
}

// ── Email login gate (the onboarding flow runs behind this) ──────────────────
function Login({ onAuthed }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function requestCode() {
    setLoading(true);
    setMessage('');
    try {
      const out = await api('/pilot/auth/email/request', 'POST', { email });
      setSent(true);
      setMessage(out.dev_code ? `Dev code: ${out.dev_code}` : 'Check your email for the 6-digit code.');
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setLoading(true);
    setMessage('');
    try {
      const out = await api('/pilot/auth/email/verify', 'POST', { email, code });
      localStorage.setItem(TOKEN_KEY, out.session_token);
      onAuthed();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <div className="font-mono text-[11px] uppercase tracking-wider text-ink-2 mb-3">Pocket Professor</div>
      <h1 className="font-serif text-[28px] leading-tight text-ink-0 mb-2">Sign in or get started.</h1>
      <p className="text-[14px] text-ink-2 mb-6 leading-[1.6]">
        New or coming back, enter your email and we'll send a one-time code. No password.
      </p>

      <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-2 mb-1">Email</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        className="w-full rounded-2xl bg-paper-1 border border-paper-edge px-4 py-3 text-[15px] text-ink-0 mb-3 focus:outline-none focus:border-accent"
      />

      {sent && (
        <>
          <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-2 mb-1">6-digit code</label>
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            className="w-full rounded-2xl bg-paper-1 border border-paper-edge px-4 py-3 text-[15px] text-ink-0 mb-3 tracking-[0.3em] focus:outline-none focus:border-accent"
          />
        </>
      )}

      <div className="flex justify-end">
        {!sent ? (
          <PrimaryButton onClick={requestCode} disabled={loading || !email}>Send code</PrimaryButton>
        ) : (
          <PrimaryButton onClick={verify} disabled={loading || !code}>Verify &amp; continue</PrimaryButton>
        )}
      </div>

      {message && (
        <div className="mt-4 rounded-2xl bg-paper-2 border border-paper-edge px-4 py-3 text-[13px] text-ink-1">
          {message}
        </div>
      )}
    </Shell>
  );
}

const EMPHASIS_LABEL = {
  micro_proof: 'Bite-size wins — small, finishable proof',
  foundational_skills: 'Foundational skills',
  schedule_stability: 'Schedule stability',
};

const PROF_LABEL = {
  best_next: 'Best next',
  easier_fallback: 'Easier fallback',
  catch_up: 'Catch up',
};

// ── The plan: switchable tracks + the user's sprint/cues + risks ─────────────
function PlanView({ plan, locked, onSwitch, onContinue, error, onRestart, onRefine, refining, refineError }) {
  const tracks = [...(plan.tracks || [])].sort((a, b) => a.rank - b.rank);
  const out = plan.agent_output || {};
  const sprint = plan.sprint || {};
  const trig = plan.triggers || {};
  const risks = out.risk_flags || [];
  const actions = out.next_actions || [];

  return (
    <Shell>
      <div className="font-mono text-[11px] uppercase tracking-wider text-ink-2 mb-3">Your plan</div>
      <h1 className="font-serif text-[28px] leading-tight text-ink-0 mb-2">Here's where we'd start.</h1>
      <p className="text-[13px] text-ink-2 mb-5 leading-[1.6]">Your pick drives the first sprint — tap another any time to switch.</p>

      {refining && (
        <div className="mb-4 rounded-2xl bg-accent-soft border border-accent px-4 py-3 text-[13px] text-ink-1">
          ✦ Reworking your options from your note… this takes a few seconds.
        </div>
      )}

      <div className="flex flex-col gap-3 mb-6">
        {tracks.map((t) => {
          const meta = CAREER_OPTIONS.find((o) => o.path_id === t.path_id);
          const active = t.path_id === plan.active_track_id;
          return (
            <button
              key={t.path_id || t.rank}
              onClick={() => !active && onSwitch(t.path_id)}
              className={[
                'w-full text-left rounded-2xl border p-4 transition-colors',
                active ? 'bg-accent-soft border-accent cursor-default' : 'bg-paper-1 border-paper-edge hover:border-ink-2 cursor-pointer',
              ].join(' ')}
            >
              <div className="flex items-center justify-between">
                <div className="font-serif text-[17px] text-ink-0">{t.title}</div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-ink-2">{active ? '✓ your pick' : 'switch'}</div>
              </div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-accent mt-1">
                {RATIONALE_LABEL[t.rationale_tag] || t.rationale_tag}
              </div>
              {meta?.blurb && <p className="text-[13px] text-ink-1 mt-2 leading-[1.6]">{meta.blurb}</p>}
              {meta && (
                <div className="font-mono text-[10px] text-ink-2 mt-2">
                  {meta.months_to_interview} to interview · {meta.overlap} overlap · {meta.starting}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl bg-paper-1 border border-paper-edge p-4 mb-3">
        <div className="font-mono text-[11px] uppercase tracking-wider text-ink-2 mb-1">Your 14-day sprint</div>
        <div className="text-[14px] text-ink-1 leading-[1.6]">
          <strong>{sprint.daily_minutes_target} min/day</strong> for {sprint.duration_days} days
          {sprint.emphasis ? ` · ${EMPHASIS_LABEL[sprint.emphasis] || sprint.emphasis}` : ''}
        </div>
      </div>

      <div className="rounded-2xl bg-paper-1 border border-paper-edge p-4 mb-3">
        <div className="font-mono text-[11px] uppercase tracking-wider text-ink-2 mb-1">Your cues</div>
        <div className="text-[14px] text-ink-1 leading-[1.6]">
          <div><strong>Primary:</strong> {trig.primary_trigger}</div>
          <div><strong>Backup:</strong> {trig.fallback_trigger}</div>
        </div>
      </div>

      {risks.length > 0 && (
        <div className="rounded-2xl bg-paper-1 border border-paper-edge p-4 mb-3">
          <div className="font-mono text-[11px] uppercase tracking-wider text-ink-2 mb-2">What we'll watch for</div>
          <div className="flex flex-col gap-2">
            {risks.map((r) => (
              <div key={r} className="text-[13px] text-ink-1 leading-[1.5]">
                <strong>{RISK_FLAGS[r]?.label || r}.</strong> {RISK_FLAGS[r]?.body || ''}
              </div>
            ))}
          </div>
        </div>
      )}

      {actions.length > 0 && (
        <div className="rounded-2xl bg-paper-2 border border-paper-edge p-4 mb-4">
          <div className="font-mono text-[11px] uppercase tracking-wider text-ink-2 mb-2">Do these first</div>
          <ul className="flex flex-col gap-1.5">
            {actions.map((a, i) => (
              <li key={i} className="text-[14px] text-ink-1 leading-[1.5] flex gap-2">
                <span className="text-accent">→</span><span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-4">
        <Feedback
          key={plan.interaction_id}
          component="onboarding_plan"
          interactionId={plan.interaction_id}
          prompt="Do these feel right for you?"
          onRefine={locked ? undefined : onRefine}
        />
      </div>

      {refineError && (
        <div className="mb-3 rounded-2xl bg-paper-2 border border-paper-edge px-4 py-3 text-[13px] text-ink-1">Couldn't rework it: {refineError}</div>
      )}
      {error && (
        <div className="mb-3 rounded-2xl bg-paper-2 border border-paper-edge px-4 py-3 text-[13px] text-ink-1">{error}</div>
      )}

      <div className="flex items-center justify-between">
        {/* Redoing the plan wipes completed days, so it is only offered before the first one. */}
        {locked ? <span /> : (
          <button onClick={onRestart} className="font-sans text-[13px] text-ink-3 hover:text-ink-1">Adjust my answers</button>
        )}
        <PrimaryButton onClick={onContinue} disabled={refining}>
          Continue to my sprint
        </PrimaryButton>
      </div>
    </Shell>
  );
}

// ── Professor session for a given sprint day: pick one bounded task ──────────
function SessionView({ output, interactionId, dayNumber, sprintDayCount, comebackNote, busy, onDone, onBack }) {
  const options = [...(output.options || [])].sort((a, b) => {
    const order = { best_next: 0, easier_fallback: 1, catch_up: 2 };
    return (order[a.label] ?? 9) - (order[b.label] ?? 9);
  });
  const actions = output.next_actions || [];
  const [picked, setPicked] = useState(null);
  const isFirst = dayNumber === 1;

  return (
    <Shell>
      <div className="font-mono text-[11px] uppercase tracking-wider text-ink-2 mb-3">
        {isFirst ? "Today's first session" : `Day ${dayNumber} of ${sprintDayCount}`}
      </div>
      {comebackNote && (
        <div className="mb-4 rounded-2xl bg-accent-soft border border-accent px-4 py-3 text-[14px] text-ink-0 leading-[1.6]">{comebackNote}</div>
      )}
      {output.recall_note && (
        <p className="text-[14px] text-ink-1 mb-3 leading-[1.6] border-l-2 border-accent pl-3">{output.recall_note}</p>
      )}
      <h1 className="font-serif text-[24px] leading-tight text-ink-0 mb-3">{output.session_objective}</h1>
      <p className="text-[14px] text-ink-2 mb-5 leading-[1.6]">Pick the one you'll do right now — that's the whole session. Then mark it done.</p>

      <div className="flex flex-col gap-3 mb-6">
        {options.map((o, i) => {
          const sel = picked === i;
          return (
            <button
              key={i}
              onClick={() => setPicked(i)}
              className={[
                'w-full text-left rounded-2xl border p-4 transition-colors',
                sel ? 'bg-accent-soft border-accent' : 'bg-paper-1 border-paper-edge hover:border-ink-2',
              ].join(' ')}
            >
              <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] uppercase tracking-wider text-accent">{PROF_LABEL[o.label] || o.label}</div>
                {sel && <div className="font-mono text-[10px] uppercase tracking-wider text-ink-2">✓ chosen</div>}
              </div>
              <div className="text-[14px] text-ink-1 leading-[1.6] mt-1">{o.task_summary}</div>
            </button>
          );
        })}
      </div>

      {actions.length > 0 && (
        <div className="rounded-2xl bg-paper-2 border border-paper-edge p-4 mb-4">
          <div className="font-mono text-[11px] uppercase tracking-wider text-ink-2 mb-2">Right now</div>
          <ul className="flex flex-col gap-1.5">
            {actions.map((a, i) => (
              <li key={i} className="text-[14px] text-ink-1 leading-[1.5] flex gap-2">
                <span className="text-accent">→</span><span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-4">
        <Feedback component="sprint_session" interactionId={interactionId} prompt="Was this session useful?" />
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="font-sans text-[13px] text-ink-3 hover:text-ink-1">Back</button>
        <PrimaryButton
          onClick={() => onDone(options[picked])}
          disabled={picked === null || busy}
        >
          {busy ? 'Saving…' : `Mark day ${dayNumber} done`}
        </PrimaryButton>
      </div>
    </Shell>
  );
}

// ADR-0027: one session a day is the default; "keep going" allows up to this many.
const MAX_SESSIONS_PER_DAY = 3;

// ── Dashboard: the returning-user home. Sprint progress + today's CTA. ───────
// Shown until a reminder time is saved: covers people who onboarded before the
// nudge existed, and an onboarding save that failed.
function ReminderPrompt({ onSave }) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setBusy(true);
    setError('');
    try {
      await onSave(value);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-paper-1 border border-paper-edge p-4 mb-4">
      <div className="text-[14px] text-ink-1 leading-[1.6] mb-3">
        When should I remind you each day?
      </div>
      <ReminderTimeField value={value} onChange={setValue} />
      {error && <div className="mt-2 text-[13px] text-ink-1">{error}</div>}
      <div className="mt-3">
        <PrimaryButton onClick={save} disabled={!value || busy}>{busy ? 'Saving…' : 'Save'}</PrimaryButton>
      </div>
    </div>
  );
}

function DashboardView({ plan, completedDays, activeTrack, doneToday, sessionsToday, comeback, needsReminderTime, onSaveReminderTime, starting, error, onStartSession, onViewPlan }) {
  const sprintDayCount = plan.sprint_day_count || plan.sprint?.duration_days || 14;
  const doneCount = completedDays.length;
  const nextDay = doneCount + 1;
  const finished = doneCount >= sprintDayCount;

  return (
    <Shell>
      <div className="font-mono text-[11px] uppercase tracking-wider text-ink-2 mb-3">Your sprint</div>
      <h1 className="font-serif text-[26px] leading-tight text-ink-0 mb-1">
        {finished ? 'Sprint complete.' : activeTrack?.title || 'Your track'}
      </h1>
      <p className="text-[13px] text-ink-2 mb-5 leading-[1.6]">
        {finished ? 'You finished all 14 days. That’s a real streak.' : `Day ${nextDay} of ${sprintDayCount} · ${doneCount} done`}
      </p>

      {/* progress dots */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {Array.from({ length: sprintDayCount }).map((_, i) => (
          <div
            key={i}
            className={[
              'h-2.5 w-2.5 rounded-full',
              i < doneCount ? 'bg-accent' : i === doneCount && !finished ? 'bg-accent-soft border border-accent' : 'bg-paper-2 border border-paper-edge',
            ].join(' ')}
          />
        ))}
      </div>

      {!finished && (
        <div className="rounded-2xl bg-paper-1 border border-paper-edge p-4 mb-4">
          <div className="font-mono text-[11px] uppercase tracking-wider text-ink-2 mb-1">
            {doneToday ? "Today's session — done ✓" : `Today: day ${nextDay}`}
          </div>
          {doneToday ? (
            <>
              <div className="text-[14px] text-ink-1 leading-[1.6]">
                Nice — you did today's bite-size win. Come back tomorrow when your trigger fires and I'll have day {nextDay} ready.
              </div>
              {sessionsToday < MAX_SESSIONS_PER_DAY && (
                <button
                  onClick={onStartSession}
                  disabled={starting}
                  className="mt-3 font-sans text-[13px] text-ink-2 underline underline-offset-2 hover:text-ink-0 disabled:opacity-50"
                >
                  {starting ? 'Setting up…' : `Keep going with day ${nextDay}`}
                </button>
              )}
            </>
          ) : (
            <>
              {comeback && (
                <div className="text-[14px] text-ink-0 leading-[1.6] mb-3">{comeback.note}</div>
              )}
              <div className="text-[14px] text-ink-1 leading-[1.6] mb-3">
                One small, finishable thing on <strong>{activeTrack?.title}</strong>. About {comeback?.minutes || plan.sprint?.daily_minutes_target || 20} minutes.
              </div>
              <PrimaryButton onClick={onStartSession} disabled={starting}>
                {starting ? 'Setting up…' : nextDay === 1 ? "Start today's first session" : `Start day ${nextDay}`}
              </PrimaryButton>
            </>
          )}
        </div>
      )}

      {needsReminderTime && !finished && <ReminderPrompt onSave={onSaveReminderTime} />}

      {error && (
        <div className="mb-3 rounded-2xl bg-paper-2 border border-paper-edge px-4 py-3 text-[13px] text-ink-1">{error}</div>
      )}

      {completedDays.length > 0 && (
        <div className="rounded-2xl bg-paper-1 border border-paper-edge p-4 mb-4">
          <div className="font-mono text-[11px] uppercase tracking-wider text-ink-2 mb-2">What you've done</div>
          <div className="flex flex-col gap-2">
            {[...completedDays].sort((a, b) => b.day_index - a.day_index).map((d) => (
              <div key={d.day_index} className="text-[13px] text-ink-1 leading-[1.5] flex gap-2">
                <span className="font-mono text-[11px] text-accent shrink-0">D{d.day_index}</span>
                <span>{d.task_summary || 'Session completed'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-start">
        <button onClick={onViewPlan} className="font-sans text-[13px] text-ink-3 hover:text-ink-1">View &amp; adjust plan</button>
      </div>
    </Shell>
  );
}

function isSameLocalDay(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function MainApp() {
  const [session, setSession] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [loading, setLoading] = useState(true);           // loading the saved plan on mount
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);      // bump to retry the load
  const [plan, setPlan] = useState(null);                 // plan_json (+ sprint_day_count) or null
  const [completedDays, setCompletedDays] = useState([]);
  const [comeback, setComeback] = useState(null);         // set by the server after 2+ missed days
  const [reminderTime, setReminderTime] = useState(undefined); // undefined = not known yet; null = none saved
  const [view, setView] = useState('dashboard');          // 'plan' | 'dashboard' | 'session'
  const [todaySession, setTodaySession] = useState(null); // professor run for the current day
  const [starting, setStarting] = useState(false);
  const [savingDay, setSavingDay] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [refining, setRefining] = useState(false);
  const [refineError, setRefineError] = useState('');

  // Load any saved plan when we have a session (returning user → dashboard).
  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        // Before the plan load: the server uses the zone to decide which days were missed.
        const saved = await settingsApi
          .save({ time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone })
          .catch(() => null);
        const res = await planApi.get();
        if (cancelled) return;
        if (saved?.settings) setReminderTime(saved.settings.reminder_time ?? null);
        const sp = res?.plan;
        if (sp) {
          setPlan({ ...sp.plan, active_track_id: sp.active_track_id, sprint_day_count: sp.sprint_day_count });
          setCompletedDays(sp.completed_days || []);
          setComeback(res.comeback || null);
          setView('dashboard');
        }
      } catch (e) {
        if (cancelled) return;
        // Never fall through to onboarding here: finishing it would replace the saved plan.
        if (e.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          setSession('');
        } else {
          setLoadError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session, loadAttempt]);

  if (!session) {
    return <Login onAuthed={() => { setLoading(true); setSession(localStorage.getItem(TOKEN_KEY) || ''); }} />;
  }
  if (loading) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-paper-edge border-t-accent animate-spin" />
          <div className="font-mono text-[11px] uppercase tracking-wider text-ink-2">Loading your sprint…</div>
        </div>
      </Shell>
    );
  }
  if (loadError) {
    return (
      <Shell>
        <h1 className="font-serif text-[26px] leading-tight text-ink-0 mb-3">Couldn't load your sprint.</h1>
        <p className="text-[14px] text-ink-1 leading-[1.6] mb-4">Your progress is safe. Check your connection and try again.</p>
        <PrimaryButton onClick={() => { setLoadError(false); setLoading(true); setLoadAttempt((n) => n + 1); }}>Try again</PrimaryButton>
      </Shell>
    );
  }
  if (!plan) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  const activeTrack =
    (plan.tracks || []).find((t) => t.path_id === plan.active_track_id) || (plan.tracks || [])[0];
  const sprintDayCount = plan.sprint_day_count || plan.sprint?.duration_days || 14;
  const sessionsToday = completedDays.filter((d) => isSameLocalDay(d.completed_at)).length;
  const doneToday = sessionsToday > 0;

  async function saveReminderTime(value) {
    const res = await settingsApi.save({ reminder_time: value });
    setReminderTime(res.settings.reminder_time);
  }

  async function handleOnboardingComplete(p) {
    setSessionError('');
    // If this fails the dashboard asks for the time again.
    if (p.triggers?.reminder_time) saveReminderTime(p.triggers.reminder_time).catch(() => {});
    try {
      const res = await planApi.save({ plan: p, active_track_id: p.active_track_id });
      setPlan({ ...p, sprint_day_count: res.plan.sprint_day_count });
      setCompletedDays(res.plan.completed_days || []);
    } catch (e) {
      // Even if the save fails, let the user see their plan — just surface it.
      setPlan(p);
      setCompletedDays([]);
      setSessionError(`Heads up — couldn't save your plan to the server (${e.message}). Your progress may not persist.`);
    }
    setView('plan');
  }

  async function startSession() {
    setStarting(true);
    setSessionError('');
    const dayNum = completedDays.length + 1;
    try {
      const res = await agents.professor({
        topic: activeTrack?.title || 'your first skill',
        comfort_level: 'beginner',
        // On a comeback day the server overrides this with the shorter length.
        minutes_available_today: plan.sprint?.daily_minutes_target || 20,
        context: dayNum === 1
          ? 'first session immediately after onboarding'
          // Past sessions are no longer sent from here: the server adds them from the student file.
          : `Day ${dayNum} of a ${sprintDayCount}-day sprint on ${activeTrack?.title}. Give a fresh, slightly more advanced small task that builds on prior days.`,
      });
      setTodaySession(res);
      setView('session');
    } catch (e) {
      setSessionError(e.message);
    } finally {
      setStarting(false);
    }
  }

  async function markDayDone(pickedOption) {
    setSavingDay(true);
    const dayNum = completedDays.length + 1;
    try {
      const res = await planApi.markDay({
        day_index: dayNum,
        track_id: plan.active_track_id,
        interaction_id: todaySession?.interaction_id || null,
        task_summary: pickedOption?.task_summary || null,
      });
      setCompletedDays(res.plan.completed_days || []);
      setComeback(null); // first session back is done; the next one today is normal length
      setTodaySession(null);
      setView('dashboard');
    } catch (e) {
      setSessionError(`Couldn't save your progress: ${e.message}`);
    } finally {
      setSavingDay(false);
    }
  }

  async function refinePlan(critique) {
    setRefining(true);
    setRefineError('');
    try {
      const res = await agents.onboarding({
        ...(plan.agent_input || {}),
        refinement: {
          previous_options: (plan.tracks || []).map((t) => t.title),
          what_didnt_fit: critique || 'no specifics given',
        },
      });
      const out = res.output || res;
      const tracks = out.career_options || [];
      const top = [...tracks].sort((a, b) => a.rank - b.rank)[0];
      const updated = {
        ...plan,
        agent_output: out,
        tracks,
        interaction_id: res.interaction_id || plan.interaction_id,
        active_track_id: top?.path_id || plan.active_track_id,
      };
      setPlan(updated);
      // Refine happens at review (no sprint days yet) → full replace is safe.
      try {
        const saved = await planApi.save({ plan: updated, active_track_id: updated.active_track_id });
        setCompletedDays(saved.plan.completed_days || []);
      } catch { /* non-fatal */ }
    } catch (e) {
      setRefineError(e.message);
    } finally {
      setRefining(false);
    }
  }

  async function switchTrack(id) {
    const updated = { ...plan, active_track_id: id };
    setPlan(updated); // optimistic
    try {
      await planApi.switchTrack(id); // metadata-only: does NOT reset sprint progress
    } catch {
      // keep the optimistic switch; it'll reconcile on next load
    }
  }

  // "Adjust my answers" / "Start over" → re-run onboarding from scratch.
  function restart() {
    setTodaySession(null);
    setPlan(null);
    setCompletedDays([]);
    setView('dashboard');
    setRefineError('');
    setSessionError('');
  }

  if (view === 'session' && todaySession) {
    return (
      <SessionView
        output={todaySession.output || todaySession}
        interactionId={todaySession.interaction_id}
        dayNumber={completedDays.length + 1}
        sprintDayCount={sprintDayCount}
        comebackNote={todaySession.comeback?.note}
        busy={savingDay}
        onDone={markDayDone}
        onBack={() => { setTodaySession(null); setView('dashboard'); }}
      />
    );
  }

  if (view === 'plan') {
    return (
      <PlanView
        plan={plan}
        locked={completedDays.length > 0}
        onSwitch={switchTrack}
        onContinue={() => setView('dashboard')}
        error={sessionError}
        onRestart={restart}
        onRefine={refinePlan}
        refining={refining}
        refineError={refineError}
      />
    );
  }

  return (
    <DashboardView
      plan={plan}
      completedDays={completedDays}
      activeTrack={activeTrack}
      doneToday={doneToday}
      sessionsToday={sessionsToday}
      comeback={comeback}
      needsReminderTime={reminderTime === null}
      onSaveReminderTime={saveReminderTime}
      starting={starting}
      error={sessionError}
      onStartSession={startSession}
      onViewPlan={() => setView('plan')}
    />
  );
}

// ── Admin portal (founder-only). Reached at #admin. Gated server-side by
//    ADMIN_EMAIL — a non-admin login here just gets a 403. ──────────────────
function daysSince(iso) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function relTime(iso) {
  const d = daysSince(iso);
  if (d === null) return '—';
  if (d === 0) return 'today';
  if (d === 1) return 'yesterday';
  return `${d}d ago`;
}

function cohortSegment(u) {
  if (!u.onboarded) return { label: "Didn't finish setup", warn: true };
  const done = Number(u.days_done) || 0;
  if (done === 0) return { label: 'Never started', warn: true };
  if (done >= Number(u.sprint_day_count || 14)) return { label: 'Completed 🎉', warn: false };
  const quiet = daysSince(u.last_session_at);
  if (quiet !== null && quiet >= 3) return { label: `Quiet ${quiet}d`, warn: true };
  return { label: 'Active', warn: false };
}

function nudgeUrl(u) {
  const subject = 'Checking in from Pocket Professor';
  let body;
  if (!u.onboarded) body = `Hey — saw you started setting up Pocket Professor but didn't finish. Want a hand getting your plan going?`;
  else if ((Number(u.days_done) || 0) === 0) body = `Hey — your plan's ready and your first 20-minute thing is waiting whenever you've got a window.`;
  else body = `Hey — your next session is ready whenever your cue hits. No rush, just here when you are.`;
  // Gmail web compose (opens a draft in the browser, not the OS mail client).
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(u.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function AdminPortal() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    (async () => {
      try {
        const out = await api('/pilot/admin/cohort', 'GET', null, token);
        if (!cancelled) setRows(out.users || []);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Could not load cohort');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  if (!token) {
    return <Login onAuthed={() => setToken(localStorage.getItem(TOKEN_KEY) || '')} />;
  }

  function signOut() {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setRows(null);
  }

  return (
    <div className="min-h-screen bg-paper-0 text-ink-0 font-sans">
      <div className="mx-auto max-w-[920px] px-5 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-ink-2 mb-1">Pocket Professor · Admin</div>
            <h1 className="font-serif text-[24px] text-ink-0">Pilot cohort</h1>
          </div>
          <button onClick={signOut} className="font-sans text-[13px] text-ink-3 hover:text-ink-1">Sign out</button>
        </div>

        {loading && <div className="text-[13px] text-ink-2">Loading…</div>}

        {error && (
          <div className="rounded-2xl bg-paper-1 border border-paper-edge p-4 text-[13px] text-ink-1">
            {error.includes('403') || /authorized/i.test(error)
              ? "This account isn't the admin. Sign out and log in with the admin email (ADMIN_EMAIL)."
              : error}
          </div>
        )}

        {rows && rows.length === 0 && <div className="text-[13px] text-ink-2">No pilot users yet.</div>}

        {rows && rows.length > 0 && (
          <div className="rounded-2xl border border-paper-edge overflow-hidden">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-paper-2 text-ink-2 font-mono text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Track</th>
                  <th className="px-3 py-2">Days</th>
                  <th className="px-3 py-2">Last session</th>
                  <th className="px-3 py-2">Joined</th>
                  <th className="px-3 py-2">Nudge</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => {
                  const seg = cohortSegment(u);
                  return (
                    <tr key={u.email} className="border-t border-paper-edge">
                      <td className="px-3 py-2 text-ink-0">{u.email}</td>
                      <td className="px-3 py-2">
                        <span className={seg.warn ? 'text-accent-deep font-medium' : 'text-ink-2'}>{seg.label}</span>
                      </td>
                      <td className="px-3 py-2 text-ink-2">{u.active_track_id || '—'}</td>
                      <td className="px-3 py-2 text-ink-1">{Number(u.days_done) || 0}/{Number(u.sprint_day_count || 14)}</td>
                      <td className="px-3 py-2 text-ink-2">{relTime(u.last_session_at)}</td>
                      <td className="px-3 py-2 text-ink-3">{relTime(u.joined_at)}</td>
                      <td className="px-3 py-2">
                        <a href={nudgeUrl(u)} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-deep underline">Email</a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stop link from the nudge email (#stop=<token>). Works without a login. ──
function StopNudges({ token }) {
  const [phase, setPhase] = useState('ask'); // ask | busy | done | error

  async function stop() {
    setPhase('busy');
    try {
      await nudgeApi.stop(token);
      setPhase('done');
    } catch {
      setPhase('error');
    }
  }

  return (
    <Shell>
      <h1 className="font-serif text-[26px] leading-tight text-ink-0 mb-3">Daily reminders</h1>
      {phase === 'done' ? (
        <p className="text-[14px] text-ink-1 leading-[1.6]">
          Reminders are off. Your sprint is still here whenever you want it.
        </p>
      ) : (
        <>
          <p className="text-[14px] text-ink-1 leading-[1.6] mb-4">
            Stop the daily reminder email? Your sprint and your progress stay as they are.
          </p>
          {phase === 'error' && (
            <p className="text-[13px] text-ink-1 mb-3">That link didn't work. Try it again from the email.</p>
          )}
          <PrimaryButton onClick={stop} disabled={phase === 'busy'}>
            {phase === 'busy' ? 'Stopping…' : 'Stop reminders'}
          </PrimaryButton>
        </>
      )}
      <div className="mt-6">
        <a href="/" className="font-sans text-[13px] text-ink-3 hover:text-ink-1">
          Open Pocket Professor
        </a>
      </div>
    </Shell>
  );
}

export function App() {
  const hash = typeof window !== 'undefined' ? window.location.hash.replace(/^#\/?/, '') : '';
  if (hash.startsWith('stop=')) return <StopNudges token={hash.slice('stop='.length)} />;
  return hash.toLowerCase() === 'admin' ? <AdminPortal /> : <MainApp />;
}
