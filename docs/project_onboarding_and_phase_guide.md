# Pocket Professor Project Guide (Onboarding + Current Phase)

## 1) Project phases (and where we are now)

### Phase 0 — Behavioral research synthesis
**What this phase does (simple):**
Phase 0 defines the behavioral rules the product is allowed to use. This is the non-negotiable logic foundation for fatigue-aware adaptation. It tells us what signals to track and what deterministic actions are allowed when those signals appear.

**Current status:** complete (canonical baseline).

**Primary file:**
- `docs/behavioral_design_v1.md`

---

### Phase 1 — System architecture
**What this phase does (simple):**
Phase 1 turns behavioral rules into system structure: database entities, event model, adaptation modules, agent boundaries, pivot design, and entitlement boundaries. It defines how the pieces fit before implementation.

**Current status:** complete (planning baseline).

**Primary files:**
- `docs/phase1_system_architecture_plan.md`
- `docs/system_invariants_v1.md`

---

### Phase 2 — Multi-agent design
**What this phase does (simple):**
Phase 2 defines strict contracts for the 3 user-facing agents. We lock personality, boundaries, output schemas, and example outputs so all downstream services can treat agents as predictable structured components—not free-form chatbots.

For each agent we include:
1. `soul.md` — tone and behavioral posture.
2. `system_instructions.md` — scope + hard boundaries.
3. `output_schema.ts` — strict JSON contract.
4. `example_output.json` — reference payload for integration checks.

**Current status:** complete for contract artifacts (runtime wiring deferred).

**Primary files:**
- `backend/src/modules/agents/phase2/onboarding-agent/*`
- `backend/src/modules/agents/phase2/professor-agent/*`
- `backend/src/modules/agents/phase2/career-coach-agent/*`
- `docs/phase2_agent_system_design.md`

---

### Phase 3 — Adaptation engine implementation (**current phase**)
**What this phase does (simple):**
Phase 3 implements deterministic rule execution against stored behavioral events. The engine evaluates windows, resolves priority, applies allowed mutations, and logs full audit records.

**Current status:** in progress (initial deterministic evaluator + tests added).

**Planned output:**
- policy evaluator runtime
- rule execution + audit persistence
- structural mutation cap enforcement in code

**New file for this slice:**
- `docs/phase3_adaptation_engine_build_slice.md`

---

### Phase 4 — Curriculum graph + pivot engine
**What this phase does (simple):**
Phase 4 will implement graph-aware sequencing and pivot recalculation. The system preserves overlap skills, recalculates readiness ETA, and keeps momentum when path changes happen.

**Planned output:**
- skill dependency traversal
- overlap-preserving pivot preview + commit flow
- interview-readiness path recalculation

---

### Phase 5 — Market gap intelligence interface integration
**What this phase does (simple):**
Phase 5 will connect a market-demand interface so curriculum gaps can be measured against job-skill signals by title/region. It adds comparison logic, not scraping internals.

**Planned output:**
- provider interface adapter
- normalized keyword mapping
- missing cluster recommendations

---

### Phase 6 — Freemium gating middleware integration
**What this phase does (simple):**
Phase 6 enforces entitlement boundaries so free vs paid capabilities are reliably controlled at API/middleware level with auditable reason codes.

**Planned output:**
- endpoint-level entitlement checks
- denial reason codes
- gating telemetry events

---

## 2) Local setup + run/test instructions (step-by-step)

> Current repository state: architecture + contract artifacts exist; full product runtime is not yet wired.

### Step 1 — Prerequisites
Install:
- Git
- Node.js 20+

Check versions:
```bash
git --version
node --version
```

### Step 2 — Clone and enter repo
```bash
git clone <your-repo-url>
cd pocket_professor
```

### Step 3 — Confirm you are on expected branch/commit
```bash
git status
```

### Step 4 — Verify required docs exist
```bash
rg --files docs | sort
```
Expected key files include:
- `docs/behavioral_design_v1.md`
- `docs/phase1_system_architecture_plan.md`
- `docs/system_invariants_v1.md`
- `docs/phase2_agent_system_design.md`
- `docs/project_onboarding_and_phase_guide.md`

### Step 5 — Verify all Phase 2 agent artifact files exist
```bash
rg --files backend/src/modules/agents/phase2 | sort
```
Expected: 12 files total (3 agents × 4 artifacts each).

### Step 6 — Validate all example JSON outputs are valid JSON
```bash
node -e "const fs=require('fs');const paths=['backend/src/modules/agents/phase2/onboarding-agent/example_output.json','backend/src/modules/agents/phase2/professor-agent/example_output.json','backend/src/modules/agents/phase2/career-coach-agent/example_output.json'];paths.forEach(p=>JSON.parse(fs.readFileSync(p,'utf8')));console.log('example JSON parse: ok')"
```
Pass condition:
- prints `example JSON parse: ok`

### Step 7 — Validate schema structure quickly (manual review checklist)
Open each schema:
```bash
sed -n '1,220p' backend/src/modules/agents/phase2/onboarding-agent/output_schema.ts
sed -n '1,220p' backend/src/modules/agents/phase2/professor-agent/output_schema.ts
sed -n '1,220p' backend/src/modules/agents/phase2/career-coach-agent/output_schema.ts
```
Check that each schema has:
1. `agent` literal
2. `schema_version`
3. bounded fields (length, enum, cardinality)
4. no free-form unbounded payload field

### Step 8 — Validate instruction boundaries (manual review checklist)
Open each system instructions file:
```bash
sed -n '1,220p' backend/src/modules/agents/phase2/onboarding-agent/system_instructions.md
sed -n '1,220p' backend/src/modules/agents/phase2/professor-agent/system_instructions.md
sed -n '1,220p' backend/src/modules/agents/phase2/career-coach-agent/system_instructions.md
```
Confirm each includes:
- strict JSON-only output requirement
- advisory-only boundary
- no direct state mutation
- no therapy/diagnostic language

### Step 9 — Validate tone and behavior constraints
Open each soul file:
```bash
sed -n '1,220p' backend/src/modules/agents/phase2/onboarding-agent/soul.md
sed -n '1,220p' backend/src/modules/agents/phase2/professor-agent/soul.md
sed -n '1,220p' backend/src/modules/agents/phase2/career-coach-agent/soul.md
```
Confirm tone is:
- compassionate but coach-like
- non-robotic
- non-therapeutic

### Step 10 — Optional quick consistency grep checks
```bash
rg -n "MUST be strict JSON|advisory only|MUST NOT mutate|therapy|diagnos" backend/src/modules/agents/phase2 -S
```
Pass condition:
- each agent instruction set contains explicit boundaries.

### Step 11 — Sign-off checklist for Phase 2 contract slice
Mark Phase 2 contract slice as verified only when all are true:
- [ ] 12/12 agent files exist
- [ ] all example outputs parse
- [ ] schemas contain bounded contracts
- [ ] instructions contain hard boundaries
- [ ] docs reflect current phase and known gaps


### Step 12 — Run Phase 3 adaptation tests
From repo root:
```bash
cd backend
npm run test:phase3
```
Pass condition:
- Node test runner shows all adaptation rule tests passing.

### Step 13 — Validate Phase 3 file locations
```bash
cd ..
rg --files backend/src/modules/adaptation/phase3 backend/tests/adaptation docs/phase3_adaptation_engine_build_slice.md
```
Confirm presence of:
- `policyEngine.ts`
- `policyEngine.test.ts`
- `phase3_adaptation_engine_build_slice.md`

### Step 14 — Manual rule walk-through
Open the rule engine and verify each required rule exists:
```bash
sed -n '1,260p' backend/src/modules/adaptation/phase3/policyEngine.ts
```
Check each mapping:
1. `missed_sessions_7d >= 2` → `workload_delta_percent: -25`
2. `late_night_sessions_7d >= 3` → schedule shift mutation
3. `topic_resistance_triggered` → `career_coach_agent` escalation
4. `pivot_interest_triggered` → curriculum recalculation
5. `consecutive_completed_sessions >= 5` → slight difficulty increase

### Step 15 — Sign-off checklist for this build slice
- [ ] Phase 2 contract artifacts validated
- [ ] Phase 3 tests passing locally
- [ ] deterministic priority order confirmed
- [ ] known gaps captured under `current conflicts`

### Step 16 — Run agent rejection-path adversarial tests
```bash
cd backend
npm run test:phase3
```
Pass condition:
- adaptation tests pass
- agent-output guard adversarial tests pass

### Step 17 — Inspect reject reason codes
```bash
sed -n '1,260p' backend/src/modules/agents/phase2/validation/agentOutputGuard.ts
```
Confirm reason codes include:
- `SCHEMA_VALIDATION_FAILED`
- `UNMAPPED_ACTION`
- `PROHIBITED_CONTENT`

---

## 3) How current phase (Phase 2) works — simple explanation

Think of this as creating **strict interface contracts** before wiring runtime logic.

- The **soul** file sets voice/personality constraints.
- The **system instructions** file sets role boundaries and prohibited behavior.
- The **schema** defines exactly what valid output looks like.
- The **example output** gives engineers/testers a ready payload for validation.

Result:
- Agents become predictable components.
- Adaptation logic can consume structured data safely.
- Future runtime integration is faster and lower-risk.

---

## 4) How the entire project will work — simple explanation

1. User sets goal + scheduling triggers during onboarding.
2. System maps user to a curated career path and skill graph.
3. User completes short sessions and produces proof artifacts.
4. Behavioral and session events are stored append-only.
5. Deterministic adaptation evaluates windowed signals.
6. Agents provide structured recommendations, not direct actions.
7. Policy layer decides what changes are allowed.
8. Structural changes are capped weekly and fully audited.
9. Progress is tracked via interview-readiness checkpoints.
10. If direction mismatch appears, pivot logic preserves overlap and recalculates path.

Core operating model:
- **Agents suggest**
- **Policies decide**
- **Events verify**
- **System adapts deterministically**

---

## current conflicts

- No direct conflict detected with the behavioral design, architecture plan, or system invariants.
- Phase 3 progress: concrete local file-backed persistence adapter is now implemented for audit records, preserving fail-closed behavior for structural mutations; production DB adapter is still pending.
- Phase 3 progress: API/worker entrypoint modules now call service orchestration (`evaluate -> build record -> persist`); framework-level HTTP/worker binding module is now in place; Fastify runtime wrapper + smoke script are available for local transport verification, while production web server/queue integration remains pending.
- Phase 3 progress: security hardening mini-slice added broader prohibited-language patterns and tamper-evident file audit chain verification.
- Phase 3 progress: TypeScript migration completed for evaluator, persistence/orchestration modules, validation guard, and tests.
