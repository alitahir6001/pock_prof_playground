# Pocket Professor — Onboarding (frontend integration)

This folder is the production React port of the **V4 Hybrid** onboarding prototype.
Drop it into `frontend/src/onboarding/` and wire the four integration points below.

## Folder layout

```
frontend/src/onboarding/
├── README.md                 — this file
├── OnboardingFlow.jsx        — top-level shell (router for steps + footer/header)
├── useOnboardingDraft.js     — state + persistence hook
├── api.js                    — typed wrappers around your /pilot endpoints
├── data.js                   — schedules, skills, career options, triggers, risks
├── tailwind.tokens.js        — design tokens to extend in tailwind.config.js
├── components/
│   ├── TrailBar.jsx          — top dotted-progress trail
│   ├── CoachNote.jsx         — signed serif note ("— P")
│   ├── YouLabel.jsx          — "You — write back" eyebrow
│   ├── StripedCircle.jsx     — geometric placeholder
│   ├── StripedArch.jsx       — geometric placeholder
│   ├── MoonRing.jsx          — phase-indicator icon
│   └── ChipRow.jsx           — toggleable chip set
└── steps/
    ├── Welcome.jsx
    ├── Schedule.jsx
    ├── Energy.jsx
    ├── Skills.jsx
    ├── Direction.jsx          — includes custom-track input
    ├── Sprint.jsx
    ├── Risk.jsx
    ├── Trigger.jsx
    ├── Proof.jsx
    └── Done.jsx
```

## 4 integration points your engineer wires

### 1) Tailwind tokens
Extend your `frontend/tailwind.config.js` with the palette in `tailwind.tokens.js`. The flow uses these utility classes (no inline colors):

- `bg-paper-{0,1,2,3}` — warm cream backgrounds
- `text-ink-{0,1,2,3}` — warm near-black ink
- `border-paper-edge` — hairline divider
- `text-accent`, `bg-accent-soft`, `border-accent` — terracotta accent
- Fonts: `font-serif` (Newsreader), `font-sans` (Inter Tight), `font-mono` (JetBrains Mono)

Load the three Google Fonts in `index.html`.

### 2) Routing
Mount `<OnboardingFlow />` at `/onboarding`. Gate it behind your existing email-auth: if `pilot_session_token` is missing, redirect to `/login`. The flow itself does not handle auth.

### 3) API endpoints (one new, two existing)

**Existing — already in your backend:**
- `POST /pilot/agents/onboarding_agent/run` — final submit
- `POST /pilot/agents/career_coach_agent/run` — custom-track review

**Draft routes — DROPPED for the pilot (2026-06-12).**
`GET/PUT/DELETE /pilot/onboarding/draft` were never built and have been removed from the frontend.
Drafts are now **localStorage-only** (see `useOnboardingDraft.js`). Server-side cross-device resume is
deferred post-pilot; reintroduce the routes + an `onboarding_drafts` table (FK → `pilot_users(user_id)`, TEXT)
if/when it returns.

### 4) Persistence semantics (the cross-device part)

`useOnboardingDraft.js` implements a **write-through cache**:

- **Anonymous (no session)** → reads/writes `localStorage` only.
- **Authed** → on mount, `GET /pilot/onboarding/draft`. If it returns a draft, restore. If nothing, fall back to `localStorage`. After every step, write to **both** `localStorage` (instant) and `PUT /pilot/onboarding/draft` (debounced 1.5s).
- **Resume across devices** is handled by the server draft. localStorage is a perf cache for offline/jittery networks (the bus-on-shift use case).
- **Pre-auth → post-auth migration** — if user starts unauthed on phone, then logs in, we read the localStorage draft and PUT it once. (`adoptLocalDraft()` helper.)

The hook returns: `{ state, setField, stepIdx, go, submit, status }`.

## Custom path → career_coach_agent

When a user types a value in the "None of these · point your own way" field on the Direction step, `state.primary_path` is set to `__custom__` and `state.custom_path` holds the string. On submit:

1. If `primary_path !== '__custom__'` → POST to `/pilot/agents/onboarding_agent/run` with the standard payload.
2. If `primary_path === '__custom__'` → first POST to `/pilot/agents/career_coach_agent/run` with `{ custom_path, current_skills, schedule, energy_bands }`. The coach returns either an approval (with overlap_ratio) or a redirect to one of the canonical paths. We surface the coach response on a **review step** between Direction and Sprint, then continue normally with the resolved path.
3. The user's onboarding is not "stuck" — they always reach Done. The custom path is recorded with provenance (`primary_path_source: 'custom_with_coach_review'`).

This satisfies Behavioral Design Principle 9 (Skill Transfer Preservation) and 10 (Directional Ambiguity Detection) — pivots route through the coach when overlap is unclear.

## What's NOT in this scope

- Email auth UI — your existing `App.jsx` flow handles `/pilot/auth/email/{request,verify}` already.
- Dashboard — Done step CTA links to `/dashboard`, which you build separately.
- Notification scheduling — when trigger fires; backend cron job, not a frontend concern.

## Mapping to onboarding_agent output schema

The flow collects exactly the input the agent needs to produce a valid `onboarding_agent v1.0.0` output:

| Flow state            | Onboarding input          |
|-----------------------|---------------------------|
| `schedule[]`          | `schedule_constraints`    |
| `energy[]`            | `energy_windows`          |
| `skills[] + skill_custom` | `current_skills`      |
| `primary_path` or `custom_path` | `goal_statement` |
| `daily_min`           | `daily_minutes_target`    |
| `emphasis`            | `sprint_emphasis`         |
| `risks_ack{}`         | `risk_acknowledgements`   |
| `primary_trig`        | `trigger_plan.primary_trigger` |
| `fallback_trig`       | `trigger_plan.fallback_trigger` |

Server then validates the agent's output against `onboardingAgentOutputSchema` (already in `backend/src/modules/agents/phase2/onboarding-agent/output_schema.ts`).
