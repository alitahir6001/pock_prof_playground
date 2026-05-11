# File maintenance rules

How to keep the persistent memory files current as you work this session.

## .ai/handoff.md — update CONTINUOUSLY

After every meaningful change (file written, bug found, plan pivoted, decision made), rewrite the relevant sections in place:

- **Last Updated** — bump to current date / session marker
- **Current State** — replace with what's true RIGHT NOW (not history)
- **Changed Files** — append new entries; remove ones that got reverted
- **Results** — add findings, test outcomes, hit rates, errors observed
- **Open Threads** — add new uncertainties; remove resolved ones
- **Next Recommended Step** — rewrite to reflect where you actually are

Don't append like a log. Rewrite sections so a cold reader sees current state, not session history.

Cap: 150 lines. Approaching it? Tighten existing sections before adding new content.

## .ai/current-task.md — update only on task transitions

Edit only when the active task changes (finished P0, starting P1, pivoting due to a finding). The What / Why / Scope / Out-of-scope / Required-reading sections describe the CURRENT task only — not a history of tasks.

## .ai/backlog.md — update at session end ONLY

At session wrap, prepend a new entry in this format:

```
## Last session: <YYYY-MM-DD> (session N)
<2-3 tight sentences: what shipped, what was learned, what's open>
```

If 4+ entries are stacked, roll the oldest out and note "Session N archived to CLAUDE.md" at the bottom. Then add that rolled-out session as a one-liner under CLAUDE.md "Recent context".

## CLAUDE.md — update at session end OR for permanent facts

- **Active gotchas**: add when you discover a non-obvious behavior future sessions need to know. Number new entries sequentially.
- **Recent context**: at session end, add a compressed paragraph (longer than backlog.md entry, shorter than handoff.md). Compress older sessions if approaching length cap.
- **Next session priorities**: rewrite ordered list based on this session's outcomes.

Cap: ~200-250 lines. Approaching it? Compress older session entries first; never delete gotchas.

## What NOT to do

- Don't duplicate handoff.md content into CLAUDE.md (different lifecycles — handoff is state, CLAUDE.md is durable knowledge).
- Don't write tutorial-style how-tos in CLAUDE.md. The code is the tutorial. CLAUDE.md tells you WHERE to look and WHAT to watch out for.
- Don't log every tool call into handoff.md. It's a state snapshot, not a diary.
- Don't update files speculatively — only when you actually have new state to record.
- Don't revert or restructure existing entries unless they're factually wrong. Append/edit; don't rewrite history.

## Quick reference: when to touch what

| Event | handoff.md | current-task.md | backlog.md | CLAUDE.md |
|---|---|---|---|---|
| Made a code change | yes | — | — | — |
| Hit a blocker / found a bug | yes | — | — | — |
| Discovered a permanent gotcha | yes | — | — | yes (gotchas) |
| Finished active task, starting new one | yes | yes | — | — |
| Pivoted approach mid-task | yes | maybe | — | — |
| Session wrapping up | yes | — | yes | yes |
