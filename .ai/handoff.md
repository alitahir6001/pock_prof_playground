## Last Updated - 2026-05-10

## Current State
Session focused entirely on documentation, planning, and knowledge infrastructure. No backend or frontend logic was changed. `.env` is ready to fill. User is about to go fill it out — that's the gate for all remaining work.

### Backend
- Agents still serve static `example_output.json` — real AI not wired yet
- Auth endpoints exist and are wired to DB
- Adaptation engine is complete (Phase 3)
- No Railway project exists yet — never deployed
- `agentOutputGuard.ts` exists and is tested but NOT called in the live agent route — must be wired when AI is connected

### Frontend
- `App.jsx` is a raw developer wizard: JSON textarea inputs, raw JSON output, debug API Base line still visible (line 132)
- Design tokens wired: `tokens.css` → `styles.css` → `main.jsx` ✓
- `frontend/src/onboarding/` has full 11-step onboarding flow — orphaned, not imported in `App.jsx`

### Docs (all updated this session)
- `docs/INDEX.md` — created; navigation guide for all docs
- `docs/understanding/` — created; 4 mental model docs (adaptation-engine, agent-layer, auth-sessions, data-model)
- `docs/breakdowns/` — deleted
- `docs/railway_pilot_deploy_guide.md` — fixed (added AI keys, fixed RESEND as required, added DATABASE_URL, added TTL vars)
- `docs/project_onboarding_and_phase_guide.md` — fixed (Phase 3 marked complete, stale conflicts replaced with current state)
- `CLAUDE.md` — fixed rule priority order (was wrong), added gotchas 6–8

## Changed Files
- `.env` — created with all placeholders including PILOT_SESSION_TTL_HOURS, PILOT_LOGIN_CODE_TTL_MINUTES
- `docs/INDEX.md` — new
- `docs/understanding/adaptation-engine.md` — new
- `docs/understanding/agent-layer.md` — new
- `docs/understanding/auth-sessions.md` — new
- `docs/understanding/data-model.md` — new
- `docs/railway_pilot_deploy_guide.md` — updated
- `docs/project_onboarding_and_phase_guide.md` — updated
- `CLAUDE.md` — rule priority corrected, gotchas 6–8 added
- `.ai/backlog.md` — deleted (redundant with auto-memory + CLAUDE.md Recent Context)

## Open Threads
1. **[BLOCKING]** User fills `.env` — Railway DB URL, Resend keys, Gemini/OpenAI/Anthropic keys
2. Wire Gemini → OpenAI → Claude fallback into all three agent endpoints (+ wire agentOutputGuard.ts)
3. Wire `OnboardingFlow.jsx` into `App.jsx`; build professor + career-coach form UIs
4. Replace raw JSON output with human-readable cards; remove debug line (App.jsx:132)
5. Railway project creation + both migrations + smoke tests
6. Fix `onboarding_drafts` broken FK before running migrations on clean DB

## Next Recommended Step
User fills `.env` → say "go" → Claude starts AI wiring (Thread 2).
