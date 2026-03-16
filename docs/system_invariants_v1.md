# Pocket Professor System Invariants v1

**Status:** Normative Constitutional Layer  
**Scope:** Entire product/runtime unless explicitly superseded by a later invariant version.

---

## 1) Determinism Guarantees

### 1.1 Determinism Definition
**Rule:** Given identical persisted inputs, formula versions, and evaluation timestamp boundaries, the system **MUST** produce identical adaptation outputs.

- **Enforcement boundary:** Adaptation Engine (`window aggregation`, `policy evaluation`, `priority resolution`, `mutation planning`), Metric Modules.
- **Violation consequence:** The evaluation result **MUST** be rejected, marked `non_deterministic_failure`, and no structural mutation **MUST** be applied.

### 1.2 Deterministic Components
**Rule:** The following components **MUST** be deterministic:
1. Window aggregation
2. Rule predicate evaluation
3. Priority ordering and tie-breaking
4. Structural mutation selection
5. Metric derivation (`momentum_score`, `volatility_index`)

- **Enforcement boundary:** Adaptation Engine and Metric Services.
- **Violation consequence:** Deployment **MUST NOT** proceed for the affected component version; runtime execution **MUST** fail closed.

### 1.3 Bounded Inputs
**Rule:** Deterministic components **MUST** read only from persisted state:
- append-only behavioral events
- persisted relational state
- explicit metric formula versions
- explicit evaluation windows (7/14/21/30 days as configured)

Deterministic components **MUST NOT** read LLM memory, free-form chat history, wall-clock randomness, or non-versioned external signals.

- **Enforcement boundary:** Data access layer + orchestration guards.
- **Violation consequence:** Evaluation run **MUST** be invalidated and recorded as policy breach.

---

## 2) Structural Mutation Cap

### 2.1 Structural Mutation Definition
**Rule:** A structural mutation is any action that changes curriculum graph shape, sequence, or unlock topology for a user. This includes path pivot commit, node insertion/removal, dependency rewiring, and checkpoint topology change.

- **Enforcement boundary:** Mutation Planner.
- **Violation consequence:** Unclassified actions **MUST** default to structural and count toward the cap.

### 2.2 Weekly Hard Cap
**Rule:** The system **MUST** enforce a hard cap of **1 structural mutation per user per weekly evaluation cycle**.

- **Enforcement boundary:** Mutation Planner + audit pre-commit check.
- **Violation consequence:** Additional structural candidates **MUST NOT** apply in the same weekly cycle.

### 2.3 Deferred Structural Mutations
**Rule:** Structural mutations exceeding cap **MUST** be deferred to the next eligible weekly cycle as a ranked queue with deterministic ordering.

- **Enforcement boundary:** Adaptation scheduler.
- **Violation consequence:** If deterministic ordering cannot be established, the queue item **MUST** be dropped and logged for review.

---

## 3) Structural vs Non-Structural Action Taxonomy

### 3.1 Structural Actions (Enumerated)
The following **MUST** be treated as structural:
1. Career path pivot commit
2. Curriculum node add/remove/reorder that changes dependency reachability
3. Unlock rule alteration affecting future node availability
4. Interview checkpoint topology alteration

### 3.2 Non-Structural Actions (Enumerated)
The following **MUST** be treated as non-structural:
1. Session-level task recommendation rank changes
2. Daily nudges/reminders
3. Tone/wording variations within contract limits
4. Option count presentation changes (without topology changes)

### 3.3 Agent Emission Prohibitions
**Rule:** Agents **MUST NOT** emit direct structural commands, direct database mutation instructions, or unrestricted free-form action payloads.

- **Enforcement boundary:** Agent Orchestrator schema validation + allowed-action mapper.
- **Violation consequence:** Payload **MUST** be rejected; no state change **MAY** occur.

---

## 4) Event Immutability Contract

### 4.1 Append-Only Requirement
**Rule:** Behavioral event records **MUST** be append-only. Existing event rows **MUST NOT** be updated or deleted in normal operation.

- **Enforcement boundary:** Event ingestion service + database permissions.
- **Violation consequence:** Write operation **MUST** fail; incident **MUST** be logged.

### 4.2 Event Versioning Requirement
**Rule:** Every event type **MUST** have an explicit schema version (`event_schema_version`) at write time.

- **Enforcement boundary:** Event validation layer.
- **Violation consequence:** Unversioned events **MUST** be rejected.

### 4.3 Schema Evolution Rules
**Rule:** Event schema evolution **MUST** be backward compatible by versioned contract. Breaking changes **MUST** use new event schema versions and **MUST NOT** reinterpret historical payloads.

- **Enforcement boundary:** Schema registry + ingestion validators.
- **Violation consequence:** Incompatible writes **MUST** be blocked.

---

## 5) Adaptation Evaluation Triggers

### 5.1 Daily vs Weekly Boundaries
**Rule:** Daily evaluations **MUST** be limited to non-structural actions. Weekly evaluations **MUST** be the only context where structural mutation is eligible.

- **Enforcement boundary:** Adaptation scheduler + mutation planner.
- **Violation consequence:** Structural action generated during daily run **MUST** be converted to deferred candidate.

### 5.2 Immediate Trigger Events
**Rule:** Immediate evaluations **MUST** run when any of the following occurs:
1. `pivot_requested`
2. repeated restart-protocol activation threshold reached
3. high abandonment threshold reached

- **Enforcement boundary:** Event-driven worker.
- **Violation consequence:** Missed immediate trigger **MUST** raise operational alert.

### 5.3 Window Sizes
**Rule:** Triggered evaluations **MUST** use explicit bounded windows (7d/14d/21d/30d) as defined per rule. Windows **MUST NOT** be inferred implicitly.

- **Enforcement boundary:** Window aggregator.
- **Violation consequence:** Evaluation without explicit window metadata **MUST** fail closed.

---

## 6) Agent Authority Boundary

### 6.1 Advisory-Only Authority
**Rule:** All agent outputs **MUST** be advisory and **MUST** pass through deterministic policy mapping before any action is applied.

- **Enforcement boundary:** Agent Orchestrator + Policy Evaluator.
- **Violation consequence:** Unmapped agent output **MUST** be ignored.

### 6.2 Allowed Action Mapping
**Rule:** Agent outputs **MUST** map only to pre-approved action types enumerated by contract. Unrecognized fields **MUST** be rejected.

- **Enforcement boundary:** JSON schema validator + allowlist mapper.
- **Violation consequence:** Contract violation **MUST** reject the agent run.

### 6.3 Direct State Mutation Prohibition
**Rule:** Agents **MUST NOT** perform direct writes to core state, events, metrics, or curriculum.

- **Enforcement boundary:** Infrastructure permissions + service boundaries.
- **Violation consequence:** Direct-write attempt **MUST** fail and trigger security alert.

---

## 7) Metric Versioning Contract

### 7.1 Version Naming Scheme
**Rule:** Metric formulas **MUST** use stable identifiers in the pattern:
- `MOMENTUM_V{major}`
- `VOLATILITY_V{major}`

Minor parameter-only changes **SHOULD** use explicit patch metadata while preserving major formula identity when semantics are unchanged.

- **Enforcement boundary:** Metric computation services + metric persistence schema.
- **Violation consequence:** Unknown or missing version **MUST** reject metric write.

### 7.2 Historical Immutability
**Rule:** Historical metric rows **MUST NOT** be recomputed or overwritten in place.

- **Enforcement boundary:** Metric writer + DB constraints.
- **Violation consequence:** Rewrite attempts **MUST** fail and be logged as invariant breach.

### 7.3 Formula Change Protocol
**Rule:** Formula semantic changes **MUST**:
1. introduce a new major version,
2. update formula spec and constants,
3. apply only to newly computed rows.

Backfills **MAY** be generated as new rows tagged with new versions; they **MUST NOT** mutate historical rows.

- **Enforcement boundary:** Release governance + metric services.
- **Violation consequence:** Non-versioned formula changes **MUST** block release.

---

## 8) Failure Isolation Rules

### 8.1 Agent Schema Validation Failure
**Rule:** If agent output schema validation fails, the run **MUST** be rejected and no downstream adaptation action **MUST** execute.

- **Enforcement boundary:** Agent Orchestrator.
- **Violation consequence:** `agent_runs.status` **MUST** record rejection reason.

### 8.2 Adaptation Audit Persistence Failure
**Rule:** If structural mutation audit persistence fails, the structural mutation **MUST NOT** commit.

- **Enforcement boundary:** Audit Writer transaction boundary.
- **Violation consequence:** Mutation **MUST** roll back atomically.

### 8.3 Metric Computation Failure
**Rule:** If metric computation fails for a cycle, the system **MUST** preserve prior valid metric state and **MUST NOT** synthesize fallback values.

- **Enforcement boundary:** Metric services + scheduler.
- **Violation consequence:** Evaluation **MUST** proceed only with available validated metrics or skip metric-dependent rules deterministically and log `metric_unavailable`.

---

## 9) Detected Architectural Tensions

1. **Event versioning gap:** Current Phase 1 plan defines append-only events but does not explicitly define an `event_schema_version` field in the event entity contract. This invariant requires it.
2. **Deferred-queue specificity gap:** Current Phase 1 plan states structural cap and deferral conceptually but does not define deterministic queue ordering rules for deferred structural mutations. This invariant requires explicit deterministic ranking.
3. **Failure-mode specificity gap:** Current Phase 1 plan states audit requirements for structural mutation but does not explicitly define behavior for metric computation failure with deterministic skip semantics. This invariant requires explicit fail-closed/skip policy.
