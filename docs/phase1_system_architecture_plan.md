# Phase 1 System Architecture Plan (POC, 3-Month Scope)

**Product:** The Professor  
**Input Constraint:** Canonical behavioral principles from `docs/behavioral_design_v1.md` are treated as fixed and unmodified.  
**Scope:** Architecture planning only (no implementation code).

---

## 1) High-Level Architecture Diagram (Text)

```text
┌──────────────────────────────────────────────────────────────────────┐
│                              Frontend (React/TS)                    │
│  - Onboarding Flow                                                   │
│  - Today Session Console                                             │
│  - Interview Readiness Checkpoints (12)                             │
│  - Pivot Explorer                                                    │
│  - Progress + Proof Artifacts                                        │
└───────────────┬──────────────────────────────────────────────────────┘
                │ HTTPS + OAuth/JWT
┌───────────────▼──────────────────────────────────────────────────────┐
│                      API Layer (Node.js + Fastify)                  │
│  Routers: auth, onboarding, sessions, curriculum, events, pivots,   │
│           checkpoints, market-gap, billing, admin                   │
│  Middleware: auth, entitlement (free/paid), request validation,     │
│             idempotency, rate limit                                 │
└───────┬───────────────────────┬───────────────────────┬──────────────┘
        │                       │                       │
        │                       │                       │
┌───────▼─────────────┐ ┌───────▼────────────────┐ ┌───▼──────────────────┐
│ Adaptation Engine   │ │ Agent Orchestrator     │ │ Curriculum/Pivot     │
│ (deterministic)     │ │ (JSON-only contracts)  │ │ Graph Service        │
│ - rule evaluator    │ │ - onboarding agent     │ │ - skill graph        │
│ - priority resolver │ │ - professor agent      │ │ - cert mapping       │
│ - mutation planner  │ │ - career coach agent   │ │ - overlap preserve   │
└───────┬─────────────┘ └───────┬────────────────┘ └───┬──────────────────┘
        │                        │                        │
        ├──────────────┬─────────┴──────────────┬─────────┤
        │              │                        │         │
┌───────▼──────┐ ┌─────▼────────────────┐ ┌────▼───────┐ │
│ Event Store  │ │ Core Relational DB   │ │ Job Queue  │ │
│ (Postgres)   │ │ (Postgres)           │ │ (BullMQ)   │ │
│ behavioral   │ │ users, plans, graph, │ │ async eval │ │
│ telemetry    │ │ checkpoints, billing  │ │ + retries  │ │
└───────┬──────┘ └──────────┬───────────┘ └────┬───────┘ │
        │                    │                  │         │
        │                    │                  │         │
        │          ┌─────────▼──────────────────▼──────┐  │
        │          │ External Integrations             │  │
        │          │ - OAuth Provider(s)               │  │
        │          │ - LLM API (strict JSON mode)      │  │
        │          │ - Billing Provider                │  │
        │          │ - Market Gap Data Provider        │  │
        │          └────────────────────────────────────┘  │
        └───────────────────────────────────────────────────┘
```

---

## 2) Backend Folder Structure (Node.js + TypeScript)

```text
backend/
  src/
    app.ts
    server.ts

    config/
      env.ts
      featureFlags.ts

    modules/
      auth/
        auth.routes.ts
        auth.service.ts
        oauth.adapters.ts

      users/
        user.routes.ts
        user.service.ts
        profile.types.ts

      onboarding/
        onboarding.routes.ts
        onboarding.service.ts
        onboarding.schemas.ts

      events/
        events.routes.ts
        events.service.ts
        events.repository.ts
        events.schemas.ts

      sessions/
        sessions.routes.ts
        sessions.service.ts
        sessions.repository.ts

      curriculum/
        curriculum.routes.ts
        curriculum.service.ts
        skillGraph.repository.ts
        certification.repository.ts

      pivots/
        pivots.routes.ts
        pivots.service.ts
        overlapCalculator.ts

      adaptation/
        adaptation.service.ts
        policyEngine.ts
        ruleRegistry.ts
        priorityResolver.ts
        mutationPlanner.ts

      agents/
        orchestrator.service.ts
        contracts/
          onboarding.output.schema.ts
          professor.output.schema.ts
          careerCoach.output.schema.ts
        prompts/
          onboarding.system.md
          professor.system.md
          careerCoach.system.md

      checkpoints/
        checkpoint.routes.ts
        checkpoint.service.ts

      marketGap/
        marketGap.routes.ts
        marketGap.service.ts
        marketGap.interface.ts

      billing/
        billing.routes.ts
        entitlement.service.ts
        entitlement.middleware.ts

    shared/
      db/
        client.ts
        migrations/
      queue/
        queue.ts
        workers/
          adaptation.worker.ts
      middleware/
        auth.middleware.ts
        validation.middleware.ts
        idempotency.middleware.ts
        rateLimit.middleware.ts
      types/
        common.ts
      utils/
        timeWindow.ts
        logger.ts

  tests/
    unit/
    integration/
    contract/
```

---

## 3) Frontend Folder Structure (React + TypeScript)

```text
frontend/
  src/
    app/
      App.tsx
      router.tsx
      providers/

    features/
      onboarding/
      today-session/
      interview-readiness/
      pivot-explorer/
      proof-artifacts/
      progress/
      billing/

    components/
      ui/
      layout/
      feedback/

    services/
      apiClient.ts
      authClient.ts
      entitlementClient.ts

    state/
      sessionStore.ts
      profileStore.ts
      entitlementStore.ts

    hooks/
      useTodayPlan.ts
      useCheckpointProgress.ts
      useEntitlement.ts

    schemas/
      apiSchemas.ts
      eventSchemas.ts

    styles/
      tokens.css
      globals.css
```

---

## 4) PostgreSQL Schema (POC)

## Design principles
- Event-sourced adaptation inputs via append-only behavioral events.
- Deterministic policy snapshots saved for auditability.
- Separation of: behavioral telemetry, policy decisions, curriculum graph, and agent outputs.

### Core entities

- **users**
  - `id (uuid, pk)`
  - `email (unique)`
  - `timezone`
  - `current_plan_tier` (`free|paid`)
  - `created_at`, `updated_at`

- **profiles**
  - `user_id (pk/fk users.id)`
  - `age_band`
  - `work_pattern` (e.g., chaotic scheduler)
  - `primary_trigger`
  - `fallback_trigger`

- **career_paths**
  - `id (uuid, pk)`
  - `title`
  - `category`
  - `is_active`

- **user_path_enrollments**
  - `id (uuid, pk)`
  - `user_id (fk)`
  - `career_path_id (fk)`
  - `status` (`active|paused|pivoting|completed`)
  - `started_at`

- **skill_nodes**
  - `id (uuid, pk)`
  - `slug (unique)`
  - `name`
  - `domain`
  - `interview_critical` (boolean)
  - `difficulty (1-5)`

- **skill_dependencies**
  - `parent_skill_id (fk skill_nodes.id)`
  - `child_skill_id (fk skill_nodes.id)`
  - composite PK

- **certifications**
  - `id (uuid, pk)`
  - `name`
  - `provider`

- **certification_skill_map**
  - `certification_id (fk)`
  - `skill_id (fk)`
  - `weight`
  - composite PK

- **career_path_skill_map**
  - `career_path_id (fk)`
  - `skill_id (fk)`
  - `priority` (`core|supporting|optional`)
  - composite PK

- **curriculum_items**
  - `id (uuid, pk)`
  - `user_id (fk)`
  - `skill_id (fk)`
  - `load_level` (`LOW|MEDIUM|HIGH`)
  - `sequence_index`
  - `status` (`locked|available|in_progress|done`)

- **interview_checkpoints** (12-step model)
  - `id (uuid, pk)`
  - `user_id (fk)`
  - `checkpoint_number (1-12)`
  - `status` (`locked|active|complete`)
  - `completed_at`

- **proof_artifacts**
  - `id (uuid, pk)`
  - `user_id (fk)`
  - `artifact_type` (`micro_proof|field_simulation|real_world_preview`)
  - `linked_skill_id (fk)`
  - `created_at`

- **behavioral_events** (append-only)
  - `id (bigserial, pk)`
  - `user_id (fk)`
  - `event_type`
  - `event_time`
  - `payload_json (jsonb)`
  - `source` (`frontend|backend|worker|agent`)
  - index on `(user_id, event_time desc)` and `(user_id, event_type, event_time desc)`

- **adaptation_evaluations**
  - `id (uuid, pk)`
  - `user_id (fk)`
  - `evaluation_time`
  - `trigger_window`
  - `events_used_json`
  - `applied_rule_ids_json`
  - `mutations_json`
  - `previous_state_json`
  - `new_state_json`

- **pivot_requests**
  - `id (uuid, pk)`
  - `user_id (fk)`
  - `from_path_id (fk)`
  - `to_path_id (fk)`
  - `overlap_ratio_preserved`
  - `status` (`pending_coach|approved|rejected|committed`)

- **agent_runs**
  - `id (uuid, pk)`
  - `user_id (fk)`
  - `agent_type` (`onboarding|professor|career_coach|resilience_coach`)
  - `input_json`
  - `output_json`
  - `schema_version`
  - `status`
  - `created_at`

- **subscriptions**
  - `id (uuid, pk)`
  - `user_id (fk)`
  - `tier` (`free|paid`)
  - `status`
  - `renewal_at`

---

## 5) Event Tracking Model

## Event contract
Each event must include:
- `event_id`
- `user_id`
- `event_type`
- `occurred_at`
- `context` (session_id, path_id, timezone)
- `payload` (strict typed per event)

## P0 event families
- **Session execution:** `session_started`, `session_completed`, `session_abandoned`, `session_missed`, `session_resumed`
- **Output proof:** `artifact_submitted`, `node_completed`, `assessment_scored`, `session_has_output`
- **Planning/trigger:** `plan_created`, `weekly_reset_opened`, `trigger_reconfigured`
- **Adaptation outcomes:** `rule_evaluated`, `mutation_applied`, `mutation_skipped`
- **Pivot events:** `pivot_requested`, `pivot_previewed`, `pivot_committed`
- **Fatigue/choice friction:** `time_to_first_action_recorded`, `options_rendered`, `option_selected`

## Determinism rules
- All adaptation reads are windowed event queries against `behavioral_events`.
- All mutations are represented as explicit records and linked to `adaptation_evaluations`.
- No adaptation decisions from free-text agent output.

---

## 6) Adaptation Engine Structure

## Components
1. **Rule Registry**
   - Source-of-truth list of canonical behavioral rules.
   - Versioned IDs (e.g., `B1_TRIGGER_RECONFIG_V1`).

2. **Window Aggregator**
   - Computes deterministic metrics for 7/14/21/30-day windows.

3. **Policy Evaluator**
   - Executes rule predicates against aggregated metrics.

4. **Priority Resolver**
   - Enforces canonical priority order:
     1) Psychological Safety / Resilience
     2) Recovery
     3) Load Calibration
     4) Interview Critical Reprioritization
     5) Progress Acceleration
     6) Pivot Exploration

5. **Mutation Planner**
   - Produces concrete plan deltas.
   - Enforces max **1 structural curriculum mutation per weekly cycle**.

6. **Audit Writer**
   - Persists `rule_id`, `trigger_window`, `events_used`, `mutation_applied`, `previous_state`, `new_state`.

## Evaluation cadence
- Daily lightweight evaluation (non-structural hints).
- Weekly structural evaluation (eligible for one structural mutation).
- Immediate evaluation on pivotal events (`pivot_requested`, repeated restarts, high abandon thresholds).

---

## 7) Agent Orchestration Layer

## Agent roles (bounded)
- **Onboarding Agent**: path ranking initialization, trigger capture, initial constraints.
- **Professor Agent**: session framing, feedback packaging, next-step explanation.
- **Career Coach Agent**: directional ambiguity handling, pivot coaching, resistance interventions.
- **Resilience Coach Agent (policy-triggered)**: required for high-risk shame/pivot loops.

## Orchestration flow
1. API receives context + deterministic state snapshot.
2. Orchestrator composes agent input payload from persisted facts only.
3. Agent response must validate against strict JSON schema.
4. Valid JSON converted to system actions only via policy guards.
5. Raw inputs/outputs persisted in `agent_runs` for audit.

## Guardrails
- Agent outputs are advisory unless explicitly mapped to allowed action types.
- No direct DB writes from agent layer.
- No memory continuity outside persisted event/state context.

---

## 8) Career Pivot Recalculation Logic

## Objective
Recompute target path while preserving momentum and overlapping competency investment.

## Algorithm (POC)
1. Identify current completed + in-progress skill nodes.
2. Compute overlap with candidate path:
   - `overlap_ratio_preserved = matched_required_skills / required_skills_in_new_path`.
3. Carry over completed overlapping nodes as completed in new path.
4. Re-rank remaining nodes by:
   - interview criticality,
   - dependency unlock value,
   - shortest path to next checkpoint.
5. Recalculate estimated time to interview readiness.
6. Apply policy constraints:
   - If overlap ratio < 0.5, require Career Coach confirmation before commit.
   - If resilience policy active, delay commit by 48h and require preserved-progress display.

## Output artifacts
- Pivot preview summary
- Preserved work count
- New ETA to checkpoint 12
- Risks and immediate next two actions

---

## 9) Freemium Gating Middleware (Architecture)

## Entitlement model
- `free`: career ranking (top 3), 2-week sprint, basic progress tracking.
- `paid`: full adaptation engine, interview simulation, resume tailoring, market gap intelligence, pivot recalculation.

## Middleware responsibilities
- Resolve user tier from `subscriptions`.
- Map endpoint/action to required entitlement.
- Allow/deny with structured reason codes.
- Emit `entitlement_checked` and `entitlement_denied` events for analytics.

## Access policy examples
- Free can call: onboarding ranking, basic session view, basic checkpoint tracking.
- Free cannot call: structural adaptation mutations, market gap analysis, pivot commit endpoint.
- Paid can call all POC endpoints.

---

## 10) Certification + Skill Graph Schema Design

## Graph model
- Directed acyclic skill dependency graph (`skill_nodes`, `skill_dependencies`).
- Certifications mapped to weighted skills (`certification_skill_map`).
- Career paths mapped to required/supporting skills (`career_path_skill_map`).

## Interview relevance support
- `interview_critical` boolean + optional weighted criticality tier in path map.
- Checkpoint engine references interview-critical coverage percentage.

## POC curation constraints
- 10–15 manually curated career paths.
- Explicit node-level metadata for deterministic scheduling:
  - estimated effort,
  - load level,
  - artifact-capable flag.

---

## 11) Market Gap Intelligence Service Interface (Design Only)

## Purpose
Compare regional job-market skill demand against target path/curriculum coverage.

## Service boundary
**Input**
- `job_title`
- `region`
- optional `experience_level`

**Output**
- normalized demanded skills
- missing skill clusters vs current curriculum
- gap severity score by cluster
- suggested cluster insertion points (non-destructive preview)

## Internal data flow (abstracted, no scraping implementation)
1. Query external job-intel provider abstraction.
2. Normalize extracted keywords to canonical skill taxonomy.
3. Diff demanded skill clusters against user/path graph coverage.
4. Return ranked gaps and confidence metadata.
5. For paid users, emit recommendations into pivot/planning surfaces.

## Interface contract requirements
- Versioned request/response schema.
- Deterministic normalization dictionary snapshot by version.
- Explainability fields (`source_count`, `normalization_confidence`, `mapping_trace`).

---

## 12) POC Non-Functional Requirements (Phase 1 architectural commitments)

- **Deterministic adaptation:** same event window + state yields same mutation output.
- **Auditability:** every structural change linked to explicit rule IDs and source events.
- **Railway compatibility:** stateless API containers, managed Postgres, worker process support.
- **Failure isolation:** agent failure cannot corrupt adaptation state.
- **Schema governance:** strict JSON schemas for all agent IO and key API payloads.

---

## 13) Phase 1 Exit Criteria (Planning Complete)

Phase 1 is complete when the following are approved:
1. Architecture diagram and service boundaries.
2. DB entity model and event taxonomy.
3. Adaptation engine modules and rule priority handling.
4. Agent orchestration constraints and JSON contract policy.
5. Pivot and entitlement control design.
6. Market Gap service interface and data flow abstraction.
