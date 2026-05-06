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

// ── Draft persistence ──────────────────────────────
export const draftApi = {
  load:   ()      => call('/pilot/onboarding/draft', 'GET'),
  save:   (state) => call('/pilot/onboarding/draft', 'PUT', state),
  clear:  ()      => call('/pilot/onboarding/draft', 'DELETE'),
};

// ── Agents ─────────────────────────────────────────
export const agents = {
  onboarding: (input) =>
    call('/pilot/agents/onboarding_agent/run', 'POST', { input }),

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

export function isAuthed() {
  return !!getToken();
}
