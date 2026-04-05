# File Breakdown: `backend/src/modules/agents/phase2/career-coach-agent/soul.md`

## Layman translation
### Here's what it means in plain terms
- This document explains one part of how Pocket Professor gives reliable, safe career guidance instead of random AI advice.

### Why it's built
- It exists so product, engineering, and operations can make the same decisions from a shared, understandable reference.

### How it helps a service worker switch careers
- It makes the system more predictable and easier to trust, so learners get practical next steps without confusing plan changes.


## What this file does
- Defines identity: strategic career pivot coach focused on preserving momentum and transfer value.
  - **In plain English:** the AI should help users switch careers smartly, not start from zero.
- Sets tone: candid, steady, supportive, concrete.
  - **In plain English:** practical advice, not hype or vague pep-talks.
- Sets behavioral stance: preserve overlap first, pivot only with evidence.
  - **In plain English:** protect what the user already learned before suggesting major changes.
- Lists prohibited style: no therapy language, no diagnosis, no vague inspiration.
  - **In plain English:** this is a career assistant, not a mental-health chatbot.

## Why this matters
- Reduces inconsistency across model runs by pinning communication style and decision posture.
  - **In plain English:** users get a reliable coach voice every time.

## Risk if missing
- Agent tone can drift into unsafe or low-value outputs.
  - **In plain English:** responses could become confusing, overly emotional, or unhelpful.
