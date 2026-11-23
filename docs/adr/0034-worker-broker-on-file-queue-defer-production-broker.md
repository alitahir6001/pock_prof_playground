---
status: accepted
date: 2026-04-04
---
# Run engine jobs through a worker with retry, idempotency and dead-letter on a JSON file queue; defer the production broker

## Context and Problem Statement
The Phase 1 plan put asynchronous evaluation and retries on a BullMQ job queue with an adaptation worker (`docs/phase1_system_architecture_plan.md:42-43`, `:151-154`). The engine was then built with a worker path beside the HTTP one, and that path needed a transport.

## Considered Options
* BullMQ job queue (the Phase 1 plan)
* A worker processing envelopes from a JSON queue file, with a production broker (SQS, RabbitMQ or Redis Streams) later

## Decision Outcome
Chosen option: "A worker processing envelopes from a JSON queue file, with a production broker (SQS, RabbitMQ or Redis Streams) later". Worker retry policy and idempotency controls landed in 9937900 (`adaptationWorkerRetryPolicy.ts`). A broker-style batch processor with retry and dead-letter queue files and telemetry counters landed in 0ec27ef (`adaptationBrokerWorker.ts`, `docs/phase3_broker_telemetry_slice.md`). The production broker adapter is listed as remaining work (`docs/phase3_broker_telemetry_slice.md`, "Remaining gap"; `docs/phase3_adaptation_engine_build_slice.md:106`). Why BullMQ was not used is not recorded.

### Consequences
* Good, because retry and dead-letter behavior is deterministic and testable from files, with no broker running (`backend/scripts/smoke_adaptation_broker_worker.sh`).
* Bad, because no worker runs in production: Railway starts only the HTTP server (`backend/railway.json`, `start:prod`), and the engine is not wired for the pilot ([ADR-0018](0018-do-not-wire-adaptation-engine-for-pilot.md), gotcha 18).

## More Information
Evidence: 9937900, 0ec27ef, `docs/phase1_system_architecture_plan.md:42-43`, `:151-154`, `docs/phase3_broker_telemetry_slice.md`, `docs/phase3_adaptation_engine_build_slice.md:106`, `backend/railway.json`. Related: [ADR-0003](0003-deterministic-rule-engine-for-adaptation.md), [ADR-0018](0018-do-not-wire-adaptation-engine-for-pilot.md), [ADR-0020](0020-defer-event-journal-rearchitecture-to-phase-4.md), [ADR-0032](0032-v2-stack-node-typescript-fastify-postgres.md).
