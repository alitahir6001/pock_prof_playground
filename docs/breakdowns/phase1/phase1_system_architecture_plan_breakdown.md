# Breakdown: `docs/phase1_system_architecture_plan.md`

## Layman translation
### Here's what it means in plain terms
- This document explains one part of how Pocket Professor gives reliable, safe career guidance instead of random AI advice.

### Why it's built
- It exists so product, engineering, and operations can make the same decisions from a shared, understandable reference.

### How it helps a service worker switch careers
- It makes the system more predictable and easier to trust, so learners get practical next steps without confusing plan changes.


## What this document is
The Phase 1 architecture plan is the blueprint translating behavioral policy into system shape: backend/frontend layout, schema, event model, adaptation engine structure, agent orchestration boundaries, pivot logic, and entitlement architecture.

## How to read it effectively
Treat each major section as an architectural contract block that should map to at least one implementation module and one validation/test path.

## Section-by-section breakdown

### 1) High-level architecture diagram
Defines bounded context relationships:
- app/client,
- backend services,
- event + adaptation pathways,
- agent orchestration surfaces.

**Importance:** sets integration seams and authority boundaries.

### 2) Backend folder structure
Declares intended code organization by responsibility.

**Importance:** this is the maintainability contract. Drift here usually causes ownership ambiguity.

### 3) Frontend folder structure
Defines presentation/state surface for user interactions and adaptation visibility.

**Importance:** ensures UX/state boundaries align with backend determinism requirements.

### 4) PostgreSQL schema design
Defines core entities and relational model.

**Importance:** persistence and auditability live/die here. Must align with adaptation record outputs.

### 5) Event tracking model
Specifies event contract families and determinism rules.

**Importance:** event quality determines policy reliability. Garbage signals produce garbage adaptation.

### 6) Adaptation engine structure
Defines adaptation components and metric derivation concepts.

**Importance:** this is the direct precursor to the Phase 3 policy + service architecture.

### 7) Agent orchestration layer
Defines bounded agent roles, flow, and guardrails.

**Importance:** prevents agents from becoming uncontrolled mutation actors.

### 8) Career pivot recalculation logic
Defines pivot algorithm objectives and outputs.

**Importance:** protects learner momentum during domain changes.

### 9) Freemium gating middleware
Defines entitlement boundaries and middleware enforcement responsibilities.

**Importance:** monetization readiness depends on this being explicit and testable.

### 10) Certification + skill graph schema
Defines graph model assumptions for interview relevance and curation.

**Importance:** this is the core of future curriculum intelligence defensibility.

### 11) Market gap intelligence interface
Defines provider-facing boundary and contract requirements.

**Importance:** ensures external market data integration does not violate architecture boundaries.

### 12) Non-functional requirements
Lists reliability/performance/security commitments for Phase 1 architecture.

**Importance:** these become operational acceptance criteria.

### 13) Exit criteria
Defines what “planning complete” means.

**Importance:** avoids perpetual architecture churn.

## Mapping to implementation status
- Phase 2 contract artifacts exist for agents.
- Phase 3 has substantial deterministic engine/runtime implementation.
- Several architecture targets remain future slices (full broker, central telemetry, advanced pivots, gating middleware depth).

## Risk assessment before micro-pilot
Risk: **Medium-High**.
- Architecture is comprehensive, but implementation is partial across later sections.

## Recommended pre-pilot actions
1. Build an architecture-to-implementation matrix with `implemented / partial / pending` tags per section.
2. Add “owner + target date” per pending section for execution clarity.
3. Add explicit dependency graph for broker, telemetry, and gating slices.
