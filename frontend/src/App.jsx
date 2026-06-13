import React, { useState } from 'react';
import OnboardingFlow from './onboarding/OnboardingFlow';
import { PrimaryButton } from './onboarding/components/Button';
import { agents, submitFeedback } from './onboarding/api';
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
  const [stage, setStage] = useState('ask'); // ask | refine | done
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [redoing, setRedoing] = useState(false);

  async function save(helpful) {
    setBusy(true);
    try {
      await submitFeedback({ component, interaction_id: interactionId || null, helpful, comment: comment || null });
    } catch {
      // feedback is non-blocking; never trap the user on a failed save
    } finally {
      setBusy(false);
    }
  }

  async function thumbsUp() {
    await save(true);
    setStage('done');
  }

  async function thumbsDown() {
    if (onRefine) {
      setStage('refine');
      return;
    }
    await save(false);
    setStage('done');
  }

  async function redo() {
    setRedoing(true); // stays true until the refreshed plan remounts this control
    await save(false);
    onRefine(comment);
  }

  if (stage === 'done') {
    return <div className="rounded-2xl bg-paper-2 border border-paper-edge p-4 text-[13px] text-ink-2">Thanks — that helps us tune it.</div>;
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
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional comment"
        rows={2}
        className="w-full rounded-xl bg-paper-0 border border-paper-edge px-3 py-2 text-[13px] text-ink-0 mb-3 focus:outline-none focus:border-accent"
      />
      <div className="flex gap-2">
        <button disabled={busy} onClick={thumbsUp} className="flex-1 rounded-full border border-paper-edge py-2 text-[14px] hover:border-accent hover:text-accent disabled:opacity-50">👍 Helpful</button>
        <button disabled={busy} onClick={thumbsDown} className="flex-1 rounded-full border border-paper-edge py-2 text-[14px] hover:border-accent hover:text-accent disabled:opacity-50">👎 Not really</button>
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
      <h1 className="font-serif text-[28px] leading-tight text-ink-0 mb-2">Let's get you set up.</h1>
      <p className="text-[14px] text-ink-2 mb-6 leading-[1.6]">
        Enter your email and we'll send a one-time code — no password to remember.
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
function PlanView({ plan, onSwitch, onStartSession, starting, error, onRestart, onRefine, refining, refineError }) {
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
          onRefine={onRefine}
        />
      </div>

      {refineError && (
        <div className="mb-3 rounded-2xl bg-paper-2 border border-paper-edge px-4 py-3 text-[13px] text-ink-1">Couldn't rework it: {refineError}</div>
      )}
      {error && (
        <div className="mb-3 rounded-2xl bg-paper-2 border border-paper-edge px-4 py-3 text-[13px] text-ink-1">{error}</div>
      )}

      <div className="flex items-center justify-between">
        <button onClick={onRestart} className="font-sans text-[13px] text-ink-3 hover:text-ink-1">Adjust my answers</button>
        <PrimaryButton onClick={onStartSession} disabled={starting || refining}>
          {starting ? 'Setting up…' : "Start today's first session"}
        </PrimaryButton>
      </div>
    </Shell>
  );
}

// ── Professor "first session": pick one bounded task for today ───────────────
function FirstSessionView({ output, interactionId, onDone, onRestart }) {
  const options = [...(output.options || [])].sort((a, b) => {
    const order = { best_next: 0, easier_fallback: 1, catch_up: 2 };
    return (order[a.label] ?? 9) - (order[b.label] ?? 9);
  });
  const actions = output.next_actions || [];
  const [picked, setPicked] = useState(null);

  return (
    <Shell>
      <div className="font-mono text-[11px] uppercase tracking-wider text-ink-2 mb-3">Today's first session</div>
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
        <Feedback component="first_session" interactionId={interactionId} prompt="Was this a useful first session?" />
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onRestart} className="font-sans text-[13px] text-ink-3 hover:text-ink-1">Start over</button>
        <PrimaryButton onClick={onDone} disabled={picked === null}>Mark today done</PrimaryButton>
      </div>
    </Shell>
  );
}

// ── Closing screen after the first session (reinforces the trigger habit) ────
function ClosingView({ onRestart }) {
  return (
    <Shell>
      <div className="font-mono text-[11px] uppercase tracking-wider text-ink-2 mb-3">That's day one</div>
      <h1 className="font-serif text-[26px] leading-tight text-ink-0 mb-4">Nice. You did the smallest real thing.</h1>
      <div className="rounded-2xl bg-paper-1 border border-paper-edge p-4 text-[15px] text-ink-1 leading-[1.6] mb-6 font-serif">
        That's the whole game — one bite-size win, then the next. Come back when your trigger fires; I'll have the next small thing ready.
      </div>
      <div className="flex justify-start">
        <button onClick={onRestart} className="font-sans text-[13px] text-ink-3 hover:text-ink-1">Start over</button>
      </div>
    </Shell>
  );
}

export function App() {
  const [session, setSession] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [plan, setPlan] = useState(null);                 // assembled plan from OnboardingFlow
  const [firstSession, setFirstSession] = useState(null); // full professor run response
  const [starting, setStarting] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [refining, setRefining] = useState(false);
  const [refineError, setRefineError] = useState('');
  const [closed, setClosed] = useState(false);

  if (!session) {
    return <Login onAuthed={() => setSession(localStorage.getItem(TOKEN_KEY) || '')} />;
  }
  if (!plan) {
    return <OnboardingFlow onComplete={(p) => setPlan(p)} />;
  }

  const activeTrack =
    (plan.tracks || []).find((t) => t.path_id === plan.active_track_id) || (plan.tracks || [])[0];

  async function startSession() {
    setStarting(true);
    setSessionError('');
    try {
      const res = await agents.professor({
        topic: activeTrack?.title || 'your first skill',
        comfort_level: 'beginner',
        minutes_available_today: plan.sprint?.daily_minutes_target || 20,
        context: 'first session immediately after onboarding',
      });
      setFirstSession(res);
    } catch (e) {
      setSessionError(e.message);
    } finally {
      setStarting(false);
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
      setPlan({
        ...plan,
        agent_output: out,
        tracks,
        interaction_id: res.interaction_id || plan.interaction_id,
        active_track_id: top?.path_id || plan.active_track_id,
      });
    } catch (e) {
      setRefineError(e.message);
    } finally {
      setRefining(false);
    }
  }

  function switchTrack(id) {
    setPlan({ ...plan, active_track_id: id });
  }

  function restart() {
    setFirstSession(null);
    setPlan(null);
    setClosed(false);
    setRefineError('');
    setSessionError('');
  }

  if (closed) {
    return <ClosingView onRestart={restart} />;
  }

  if (firstSession) {
    return (
      <FirstSessionView
        output={firstSession.output || firstSession}
        interactionId={firstSession.interaction_id}
        onDone={() => setClosed(true)}
        onRestart={restart}
      />
    );
  }

  return (
    <PlanView
      plan={plan}
      onSwitch={switchTrack}
      onStartSession={startSession}
      starting={starting}
      error={sessionError}
      onRestart={restart}
      onRefine={refinePlan}
      refining={refining}
      refineError={refineError}
    />
  );
}
