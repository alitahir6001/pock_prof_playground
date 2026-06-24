// frontend/src/onboarding/api.js
// Wrappers around the /pilot endpoints used by the onboarding flow.

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

function getToken() {
  return localStorage.getItem('pilot_session_token') || '';
}

async function call(path, method, body) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 404) return null;
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload.ok === false) {
    const err = new Error(payload.detail || payload.error_code || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return payload;
}

// Draft persistence (GET/PUT/DELETE /pilot/onboarding/draft) was removed for the
// pilot — that route does not exist server-side and drafts are now localStorage-only
// (see useOnboardingDraft.js). Reintroduce here if server-side drafts return post-pilot.

// ── Agents ─────────────────────────────────────────
export const agents = {
  onboarding: (input) =>
    call('/pilot/agents/onboarding_agent/run', 'POST', { input }),

  professor: (input) =>
    call('/pilot/agents/professor_agent/run', 'POST', { input }),

  careerCoachReview: ({ custom_path, current_skills, schedule, energy_bands }) =>
    call('/pilot/agents/career_coach_agent/run', 'POST', {
      input: {
        intent: 'custom_path_review',
        custom_path,
        current_skills,
        schedule_constraints: schedule,
        energy_windows: energy_bands,
      },
    }),
};

// ── Sprint plan persistence (one active plan per user) ──
export const planApi = {
  // returns { ok, plan } where plan is null when none saved yet
  get: () => call('/pilot/plan', 'GET'),
  save: ({ plan, active_track_id, sprint_day_count }) =>
    call('/pilot/plan', 'POST', { plan, active_track_id, sprint_day_count }),
  switchTrack: (active_track_id) =>
    call('/pilot/plan/track', 'POST', { active_track_id }),
  markDay: ({ day_index, track_id, interaction_id, task_summary }) =>
    call('/pilot/plan/day', 'POST', { day_index, track_id, interaction_id, task_summary }),
};

// ── Feedback ───────────────────────────────────────
export function submitFeedback({ component, interaction_id, helpful, comment }) {
  return call('/pilot/feedback', 'POST', { component, interaction_id, helpful, comment });
}

export function isAuthed() {
  return !!getToken();
}
