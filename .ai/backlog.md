# Session Backlog

Rolling window of recent sessions. Complete overview lives in CLAUDE.md in root.

---

## Session: 2026-05-08

**Goal:** Orient, plan, and set up for pilot readiness.

**Decisions made:**
- Tier 0 resolved: real AI — Gemini primary, OpenAI fallback, Claude fallback (all via env vars)
- Target users: service industry workers (bartenders, servers, cashiers) — app-literate, non-technical
- Deploy target: Railway (account exists, no project yet) + Resend (account exists, not configured)
- Frontend discovery: design tokens wired ✓, OnboardingFlow.jsx exists but orphaned (not in App.jsx) ✗

**Work completed:**
- Initialized all `.ai/` files
- Created `.env` with safe placeholders (no unsafe defaults)
- Updated project memory with all decisions
- Mapped full next-session work: env vars → AI wiring → UI integration → deploy

**Not started:**
- AI wiring (waiting for .env to be filled)
- OnboardingFlow.jsx integration into App.jsx
- Professor + career coach form UIs
- Output cards / debug line removal
- Railway deployment

---

## Session: 2026-05-07 (initial)

**Goal:** Project orientation.

**Decisions made:**
- Confirmed pilot readiness as the primary goal
- Initial tiered plan established (Tiers 0–4)
