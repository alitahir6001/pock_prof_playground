---
status: deprecated
date: 2026-02-22
---
# Build the rewrite in small AI-generated slices merged by PR, then add breakdown docs to explain the code

## Context and Problem Statement
The Node/TypeScript rewrite ([ADR-0031](0031-rebuild-on-node-typescript-and-postgres.md)) was a large amount of code for a solo founder. The question was how to produce it, and later how the founder would keep up with what had been produced.

## Considered Options
* (alternatives not recorded)

## Decision Outcome
Chosen option: generate the code in numbered slices on `codex/...` branches and merge each by pull request. The reason is not recorded.

* 15 distinct `codex/...` branches were merged through 29 merge commits, from PR #18 (2026-02-22) to PR #36 (2026-04-11). The `codex/` prefix is the branch naming of OpenAI's Codex agent (inferred from the prefix; the POC repo's single PR branch is `codex/create-minimal-backend-project-setup`).
* Each slice landed with its tests and a slice summary doc, for example "Slice A" file adapter (a12f7d7), "Slice B" entrypoints (a10f89b), "Slice C" bindings (c8faa06), and `docs/phase3_broker_telemetry_slice.md` (0ec27ef).
* From 2026-03-28 a breakdown plan asked for a block-by-block walk of every module, "for micro-pilot readiness and incident response" (`docs/code_breakdown_plan.md`, 9937900). Per-file breakdowns followed in `docs/breakdowns/` (22d0970, b38d992, 08602c6, 2026-04-04 to 04-05).
* The breakdowns were deleted on 2026-05-10 as "all derivative" and replaced by `docs/understanding/` (1185db0, 1b6ebd6, `docs/INDEX.md`).

### Consequences
* Good, because each slice was small, tested and reviewable on its own.
* Bad, because the explanation of the code came after the code, and was written twice (breakdowns, then `docs/understanding/`), inferred from the order of the commits above.

## More Information
Evidence: merge commits for PR #18 to #36 (`git log --merges`), a12f7d7, a10f89b, c8faa06, 0ec27ef, 9937900, 22d0970, b38d992, 08602c6, 1185db0, 1b6ebd6, `docs/code_breakdown_plan.md`, `docs/INDEX.md`. Deprecated: the last `codex/` merge was PR #36 (2026-04-11). Who writes code now: [ADR-0022](0022-founder-types-claude-reviews-ownership-ladder.md) and [ADR-0026](0026-claude-writes-vision-steps-1-4-founder-reviews.md).
