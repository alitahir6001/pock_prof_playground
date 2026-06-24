# What is Pocket Professor

**Status:** Product overview, current as of 2026-06-14.
**Audience:** New contributors, founders sharing the vision, anyone trying to understand what this app actually does and how it actually works today.

---

## The product in one breath

Pocket Professor is a structured, adaptive learning coach for adults who want to change careers but have chaotic lives and no time. It uses AI to produce personalized career direction and daily learning sessions, and a deterministic rule engine to adapt that plan to how the user actually behaves over time. It is mobile-first, designed to fit in the pockets of people on shift schedules.

The tagline that captures the soul: **"I won't tell you this is easy. I won't promise a new career in 30 days. I will help you find the next small thing you can do — tonight, after your shift — and the one after that."**

---

## Who it's for

The pilot persona is sharp on purpose:

- **Service-industry workers, age ~35+** — bartenders, servers, cashiers, line cooks, retail.
- **Chaotic schedules** — closing shifts, doubles, rotating hours, fatigue is a constant.
- **App-literate but not technical** — they live on their phones, but they're not developers or knowledge workers.
- **Stuck and want out** — knows they don't want to be doing this in five years; not sure what they *do* want.
- **Time-poor** — 15–30 minutes a day is realistic, not 2 hours.

This is the pilot wedge, not the product ceiling. The underlying engine is general (see "What Pocket Professor isn't" at the end and `.ai/product-direction-multi-mode-learning.md` for the post-pilot "learn anything" mode).

---

## The core design principles (what makes this app different)

Most learning apps optimize for streaks, gamification, and theory videos. Pocket Professor explicitly does not. From the canonical behavioral design doc:

**Optimizes for:**
- Competence evidence — every session produces something visible.
- Interview readiness — proximity to a real outcome, not abstract progress.
- Recovery resilience — missing a day is normal, not a failure.
- Pivot preservation — if you change direction, your overlapping skills carry over.
- Chaos-adaptive planning — works around shift work, not against it.

**Refuses to be:**
- Streak-driven (no shame for missing).
- Dopamine-gamified (no points, badges, leaderboards).
- Therapy (it's a coach, not a counselor; safety-blocked from medical/diagnostic language).
- Passive content consumption (no "watch this lecture" loops).

Two architectural commitments that flow from this:

1. **All adaptation derives from stored behavioral events** — never from LLM memory. The engine is reproducible.
2. **All rules are deterministic and auditable** — given the same inputs, the same outputs.

---

## What it does for the user (the experience today)

A first-time user flows through this in roughly 5–10 minutes:

### 1. Login
Email + 6-digit code (no password). Local-dev shows the code on screen; production sends it via Resend.

### 2. Onboarding (11 steps, mobile-first, ~440px column)
A guided, paper-and-ink-themed flow with a "coach voice" (warm, direct, no hype):

- **Welcome** — sets the tone ("I won't tell you this is easy…")
- **Schedule** — pick your shift patterns (closing, doubles, rotating, on-call, weekends)
- **Energy** — which time bands you have any focus in (pre-dawn, morning, midday, afternoon, evening, late)
- **Skills** — what you already do well (de-escalating conflict, multitasking, POS, reading people, etc.) + free text
- **Direction** — broad domain chips ("Tech & IT," "Healthcare & care," "Skilled trades," etc.) + a free-text field that explicitly invites *"what would you rather avoid"* — the persona often knows what they don't want more than what they do
- **Suggestions (mid-flow AI call)** — the Onboarding agent runs here. The user sees 3–6 personalized career tracks ranked by fit, with rationale tags ("highest skill overlap," "fits chaotic hours," "fastest to interview"). They pick one for their first sprint; the others stay switchable later.
- **Sprint** — daily-minutes slider (10–60) and emphasis (Bite-size wins / Depth study / Mixed). The AI's suggestion pre-fills these.
- **Risk** — gentle heads-up cards based on their schedule/energy ("Schedule swings week to week — we'll route triggers around fixed events," "High fatigue pattern — late-shift days cap at LOW-load tasks").
- **Trigger** — the user defines two *implementation intentions*: a Primary cue ("after I clock out, before driving home") and a Fallback for chaos days. Suggested phrases provided.
- **Done** — quick summary of cadence and cues.

### 3. The Plan view
After onboarding, the user lands on their personalized plan:
- All 3–6 suggested career tracks, with **the picked one marked "your pick"** and the others showing **"switch"** — they can change at any time, and the switch propagates to today's session.
- The 14-day sprint cadence and emphasis.
- Their two cues.
- Risk flags the system will watch for.
- "Do these first" — 2–3 concrete next actions.
- **Feedback control** — thumbs up/down with optional comment. Thumbs-down opens a casual "what didn't fit?" prompt that re-runs the AI with their critique to produce a refreshed plan.

### 4. First session
"Start today's first session" calls the Professor agent and shows:
- One session objective ("Use 20 minutes to produce one visible work sample for medical receptionist basics")
- 2–3 concrete task options labeled **Best next / Easier fallback / Catch up** (the constrained-choice principle)
- The user **picks one** (selectable, not just display)
- "Right now" instructions
- Feedback control
- **"Mark today done"** → closing screen

### 5. Closing screen
A warm reinforcement of the habit: *"That's day one. Nice. You did the smallest real thing. Come back when your trigger fires; I'll have the next small thing ready."*

### 6. Returning users (the sprint loop)
On return, a user is loaded into a **Dashboard** view showing their persisted sprint progress (day N of 14). Each day's Professor session is gated to one per day, with a "Suggestions" escape hatch to switch tracks. This is what lets the pilot actually measure whether users come back at all.

### 7. Founder admin
A `#admin` route (gated server-side by `ADMIN_EMAIL`) gives the founder a cohort dashboard — fail-closed if the env var is unset, so it never accidentally exposes data.

---

## How it works under the hood

### Architecture at a glance

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React + Vite, Tailwind v4, mobile-first)         │
│    - Login → OnboardingFlow → PlanView → FirstSession       │
│      → Closing → Dashboard (returning users)                │
│    - Design tokens: paper/ink/accent, serif/sans/mono       │
│    - Drafts in localStorage only                            │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS, bearer-token sessions
┌──────────────────────────▼──────────────────────────────────┐
│  Backend (Fastify on Node 20+, TypeScript strict)           │
│                                                             │
│  Pilot API endpoints (run_adaptation_fastify.mjs):          │
│    /pilot/auth/email/request, /verify                       │
│    /pilot/me                                                │
│    /pilot/agents/:agentType/run                             │
│    /pilot/feedback                                          │
│    /pilot/interactions                                      │
│    /pilot/plans, /pilot/sprint/day                          │
│    /pilot/admin/cohort                                      │
│    /adaptation/health, /adaptation/evaluate                 │
│                                                             │
│  ┌─────────────────────┐  ┌────────────────────────────┐    │
│  │ Agent Inference     │  │ Adaptation Engine          │    │
│  │ - Provider chain    │  │ - Deterministic 5-rule     │    │
│  │   (OpenAI→Gemini→   │  │   policy evaluator         │    │
│  │   Anthropic)        │  │ - Fail-closed structural   │    │
│  │ - 3 tiers           │  │   mutations                │    │
│  │   (fast/mid/deep)   │  │ - 1 mutation/week cap      │    │
│  │ - Output guard      │  │ - Audit-record persistence │    │
│  └─────────────────────┘  └────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  PostgreSQL                                                 │
│  - pilot_users, pilot_sessions, pilot_login_codes           │
│  - pilot_agent_interactions, pilot_feedback_events          │
│  - pilot_plans, pilot_sprint_days                           │
│  - adaptation_evaluations (audit log)                       │
└─────────────────────────────────────────────────────────────┘
```

### The three AI agents

Each agent has a strict contract: a `soul.md` (personality + tone), `system_instructions.md` (scope + boundaries), an `output_schema.ts` (the exact JSON shape), and an `example_output.json`. All output is run through a hand-rolled output guard before reaching the user.

**Onboarding Agent** (tier: `deep`)
A calm, practical coach. Reads schedule, energy, skills, interested domains, and a free-text note. Returns:
- 3–6 ranked career options with rationale tags
- A trigger plan (primary + fallback)
- A 14-day sprint recommendation (minutes/day + emphasis)
- Risk flags
- 2–3 concrete next actions

**Professor Agent** (tier: `fast`)
The day-to-day execution coach. Reads the active track and minutes available. Returns:
- One session objective
- 2–3 ranked options labeled `best_next` / `easier_fallback` / `catch_up`
- A resistance signal and escalation recommendation
- 2 next actions

**Career Coach Agent** (tier: `deep`)
The pivot specialist. Surfaces preserved progress and pivot guidance when a user is stuck. Currently kept for future use; the onboarding flow used to invoke it for custom paths, but the new domains model handled that more elegantly.

### The AI provider service

Custom-built, no SDKs — just `fetch` against three providers' REST endpoints:

- **Chain order:** OpenAI → Gemini → Anthropic (cost/speed balance)
- **Skips** any provider without an API key
- **Falls through** on HTTP error, timeout, network error, parse failure, or guard validation failure
- **Throws** only when *every* provider fails — and even then, the route falls back to the agent's canonical `example_output.json` so the user never gets a 500
- **3 tiers** (`fast` / `mid` / `deep`), each mapping to a model per provider, all env-overridable

Verified model IDs (as of 2026-06-13):
| Tier | OpenAI | Gemini | Anthropic |
|---|---|---|---|
| fast | gpt-5.4-mini | gemini-3.5-flash | claude-haiku-4-5 |
| mid | gpt-5.4 | gemini-3.5-flash | claude-sonnet-4-6 |
| deep | gpt-5.5 | gemini-3.1-pro-preview | claude-opus-4-8 |

Live verification: `npm run smoke:ai` (provider probe) and `npm run smoke:agents` (end-to-end agent inference).

### The output guard

A hand-rolled, dependency-free validator that runs against every agent response before it reaches the user:

- **Schema validation:** exact field sets, allowed enums, length caps, count constraints.
- **Prohibited content scan:** blocks medical/psychological diagnostic language (therapy, disorder, depression, "talk to a psychiatrist," etc.). Deliberately narrowed for the IT domain so technical vocabulary like "diagnose a network issue" or "prescribed checklist" is allowed — diagnosis is only flagged in clear medical collocation.
- **Plugged into the provider chain** as the `validate` callback — a guard failure makes the chain fall through to the next provider, treating a bad answer the same as a network error.

The guard is the source of truth, and a drift-guard test asserts each agent's `example_output.json` still passes it.

### The adaptation engine (Phase 3)

Deterministic, no AI. Reads stored behavioral counters and applies the first matching rule from a priority-ordered list. Five rules implemented today:

| Priority | Rule | Trigger | Action |
|---|---|---|---|
| 1 | Topic resistance | flag set | escalate to Career Coach |
| 2 | Pivot interest | flag set | recalculate curriculum (structural — capped) |
| 3 | Missed sessions | ≥2 in 7d | reduce workload 25% |
| 4 | Late-night cluster | ≥3 in 7d | suggest schedule shift |
| 5 | Consecutive completions | ≥5 | increase difficulty |

Hard rules enforced by the engine and infrastructure:
- **Identical inputs → identical outputs.** No randomness, no LLM calls, no wall-clock state.
- **Structural mutations are fail-closed:** the audit record must persist before any curriculum change commits.
- **Max 1 structural mutation per user per week.**
- **Agents emit JSON only** and have no direct write authority — all actions route through the deterministic policy mapper.

The current 5-rule slice is a faithful but partial implementation of an 11-principle behavioral design doc. The remaining principles (full Restart Protocol, energy-band restriction, fresh-start resets, 12 interview-readiness checkpoints, the dedicated Resilience Coach agent) are documented and planned for Phase 4+. See `.ai/behavioral-science-and-engine-alignment.md` for the gap analysis and the open research thread.

### Data model

PostgreSQL only. Eight tables, each migrated separately:

- `pilot_users` — `user_id`, `email` (unique), `created_at`, `last_login_at`
- `pilot_sessions` — bearer-token sessions, hashed, TTL'd
- `pilot_login_codes` — hashed 6-digit codes, single-use, TTL'd, with brute-force counter
- `pilot_agent_interactions` — every agent run: input, output, helpful?, comment, timestamp
- `pilot_feedback_events` — standalone feedback with arbitrary metadata
- `pilot_plans` — the user's plan (career tracks, sprint config, cues, active track)
- `pilot_sprint_days` — per-day progress (gated to one Professor session per day)
- `adaptation_evaluations` — append-only audit log of every engine evaluation

All events are append-only; nothing is updated in-place except session `last_seen_at` and plan track-switches.

### Security posture (pre-deploy pass, 2026-06-14)

Five hardening fixes shipped before deploy:
- **Login dev-code gated** by `PILOT_EXPOSE_DEV_CODE` — if Resend fails in prod without this flag set (it shouldn't be in prod), the code is NOT leaked. Previously a misconfig could have exposed the login code in API responses, which is an auth-bypass.
- **Brute-force lockout** — 8 failed verifies per TTL window across all codes for an email → 429. Counter survives fresh code generation.
- **Wildcard `FRONTEND_ORIGIN` refused** when `NODE_ENV=production` — boot fails fast rather than serving insecure CORS.
- **`/adaptation/evaluate` gated in prod** by `ADAPTATION_INTERNAL_TOKEN` (or fail-closed disabled if unset). Locally it's open for smoke tests.
- **CSPRNG login codes** — `crypto.randomInt` not `Math.random`.

Admin portal (`#admin`) is **server-enforced**, not UI-hidden. The frontend route is just a normal login gated by `ADMIN_EMAIL` matching the session's email; fail-closed if the env var is unset.

---

## What's built today vs. what's not

### Built and verified end-to-end
- Real AI agents (Onboarding, Professor, Career Coach) with provider fallback, output guard, and per-agent tiers
- Email login + sessions + brute-force lockout
- Mobile-first onboarding UI with mid-flow AI track picker, switchable tracks, selectable first-session tasks, regenerate-on-thumbs-down, and closing screen
- Persisted sprint loop (`pilot_plans` + `pilot_sprint_days`) — returning users see real progress
- Founder admin portal (`#admin`, server-gated)
- Adaptation engine (5-rule slice, deterministic, fail-closed)
- Local PostgreSQL with all migrations applied
- Pre-deploy security pass

### Built but not yet active
- The Career Coach agent (kept for future use; no longer invoked by onboarding)
- `/adaptation/evaluate` exists but isn't being called from any user-facing event yet — the engine is built but not wired to behavioral triggers in the live route. Triggering it is Phase 4 work.

### Phase C — not done yet (the last thing keeping it from real users)
- Railway project (Postgres + backend + frontend services)
- Production environment variables filled (Resend account, exact URLs, `NODE_ENV=production`)
- Migrations run against production Postgres
- Smoke test against the deployed URL
- Deploy prep IS done: `railway.json` for both services, Nixpacks (no Dockerfile), `start:prod`, devDep-include build command.

### Behavioral principles documented but not yet implemented
Six of the eleven behavioral principles from the canonical doc are partial or absent in the engine: the full Restart Protocol, energy-band load restriction, the 12 interview-readiness checkpoints, the dedicated Resilience Coach, the constrained-choice adaptive reduction, and the temporal reset mechanism. These are post-pilot work.

### Explicitly post-pilot (captured in strategic docs)
- Scoped behavioral-science research → operationalize unsourced thresholds (the "40%," "72 hours," "180 seconds" in the doc are currently guesses) → harden engine rules
- The "Learn a Skill" mode — career-switch becomes one of N modes; the universal engine drives the rest
- Multi-provider personalization layer ("the app learns the user")
- Phases 4–6: full curriculum graph, market-gap intelligence, freemium gating

---

## What Pocket Professor *isn't*

Naming this explicitly because it's easy to slide into one of these:

- **Not a course platform.** No video library, no lectures, no syllabus to consume. It tells you what to do today; the doing happens off-app.
- **Not a job board.** It points at career *paths*; it doesn't list openings (yet).
- **Not therapy.** It acknowledges fatigue and frustration; it never diagnoses, never validates hopeless framing, and is content-filtered against medical/psychological language.
- **Not a productivity tracker.** No streaks, no scoring, no leaderboards. "Recovery over perfection" is a design principle, not a feature.
- **Not a knowledge graph.** The "learns the user" personalization vision is real but explicitly post-pilot; today the only state is structured events + a deterministic rule engine.
- **Not locked to careers.** The underlying engine is general; "career-switching" is a pilot wedge. The product can grow into a coach for *any* skill goal (a language, an instrument, a certification) and the founder explicitly intends to.

---

## Where to read more

- **`docs/behavioral_design_v1.md`** — the canonical 11-principle behavioral design (read before any rule work).
- **`docs/system_invariants_v1.md`** — non-negotiable architectural rules.
- **`.ai/behavioral-science-and-engine-alignment.md`** — gap analysis: doc vs. code, unsourced thresholds, the post-pilot research plan.
- **`.ai/product-direction-multi-mode-learning.md`** — the "career-switch is a mode" thesis and the path to a general learning coach.
- **`.ai/handoff.md`** — current session state, what just shipped, what's next.
- **`CLAUDE.md`** — durable engineering knowledge: gotchas, env vars, conventions.
- **`docs/INDEX.md`** — navigation for everything else.
