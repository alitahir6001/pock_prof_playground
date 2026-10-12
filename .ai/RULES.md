# File maintenance rules

Session state lives in `.ai/handoff.md`, maintained by the global update-session-context skill.

## CLAUDE.md — update at session end OR for permanent facts

- **Active gotchas**: add when you discover a non-obvious behavior future sessions need to know. Number new entries sequentially.

## What NOT to do

- Don't duplicate handoff.md content into CLAUDE.md (different lifecycles — handoff is state, CLAUDE.md is durable knowledge).
- Don't write tutorial-style how-tos in CLAUDE.md. The code is the tutorial. CLAUDE.md tells you WHERE to look and WHAT to watch out for.
- Don't log every tool call into handoff.md. It's a state snapshot, not a diary.
- Don't update files speculatively — only when you actually have new state to record.
- Don't revert or restructure existing entries unless they're factually wrong. Append/edit; don't rewrite history.
