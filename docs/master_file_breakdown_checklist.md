# Master File Breakdown Checklist

Scope: repository files selected for file-by-file breakdown before micro-pilot.

Legend: `[x]` complete, `[ ]` pending.


## (root)
- [ ] `.gitignore`
- [ ] `readme.md`

## backend
- [ ] `backend/db/migrations/20260325_001_create_adaptation_evaluations.down.sql`
- [ ] `backend/db/migrations/20260325_001_create_adaptation_evaluations.up.sql`
- [ ] `backend/docs/adaptation_evaluations_migration_runbook.md`
- [ ] `backend/docs/adaptation_troubleshooting_guide.md`
- [ ] `backend/package.json`
- [x] `backend/scripts/run_adaptation_fastify.mjs`
- [x] `backend/scripts/run_adaptation_worker.mjs`
- [x] `backend/scripts/run_adaptation_broker_worker.mjs`
- [x] `backend/scripts/smoke_adaptation_runtime.sh`
- [x] `backend/scripts/smoke_adaptation_worker.sh`
- [x] `backend/scripts/smoke_adaptation_broker_worker.sh`
- [x] `backend/src/modules/adaptation/phase3/adaptationEvaluationEntrypoints.ts`
- [x] `backend/src/modules/adaptation/phase3/adaptationEvaluationFileAdapter.ts`
- [x] `backend/src/modules/adaptation/phase3/adaptationEvaluationPersistence.ts`
- [x] `backend/src/modules/adaptation/phase3/adaptationEvaluationPostgresAdapter.ts`
- [x] `backend/src/modules/adaptation/phase3/adaptationEvaluationRecord.ts`
- [x] `backend/src/modules/adaptation/phase3/adaptationEvaluationService.ts`
- [x] `backend/src/modules/adaptation/phase3/adaptationFrameworkBindings.ts`
- [x] `backend/src/modules/adaptation/phase3/adaptationObservability.ts`
- [x] `backend/src/modules/adaptation/phase3/adaptationWorkerRetryPolicy.ts`
- [x] `backend/src/modules/adaptation/phase3/policyEngine.ts`
- [x] `backend/src/modules/agents/phase2/career-coach-agent/example_output.json`
- [x] `backend/src/modules/agents/phase2/career-coach-agent/output_schema.ts`
- [x] `backend/src/modules/agents/phase2/career-coach-agent/soul.md`
- [x] `backend/src/modules/agents/phase2/career-coach-agent/system_instructions.md`
- [x] `backend/src/modules/agents/phase2/onboarding-agent/example_output.json`
- [x] `backend/src/modules/agents/phase2/onboarding-agent/output_schema.ts`
- [x] `backend/src/modules/agents/phase2/onboarding-agent/soul.md`
- [x] `backend/src/modules/agents/phase2/onboarding-agent/system_instructions.md`
- [x] `backend/src/modules/agents/phase2/professor-agent/example_output.json`
- [x] `backend/src/modules/agents/phase2/professor-agent/output_schema.ts`
- [x] `backend/src/modules/agents/phase2/professor-agent/soul.md`
- [x] `backend/src/modules/agents/phase2/professor-agent/system_instructions.md`
- [x] `backend/src/modules/agents/phase2/validation/agentOutputGuard.ts`
- [ ] `backend/tests/adaptation/adaptationEvaluationEntrypoints.test.ts`
- [ ] `backend/tests/adaptation/adaptationEvaluationFileAdapter.test.ts`
- [ ] `backend/tests/adaptation/adaptationEvaluationPersistence.test.ts`
- [ ] `backend/tests/adaptation/adaptationEvaluationPostgresAdapter.test.ts`
- [ ] `backend/tests/adaptation/adaptationEvaluationService.test.ts`
- [ ] `backend/tests/adaptation/adaptationFrameworkBindings.test.ts`
- [ ] `backend/tests/adaptation/adaptationObservability.test.ts`
- [ ] `backend/tests/adaptation/adaptationWorkerRetryPolicy.test.ts`
- [ ] `backend/tests/adaptation/node-shims.d.ts`
- [ ] `backend/tests/adaptation/policyEngine.test.ts`
- [ ] `backend/tests/agents/agentOutputGuard.test.ts`
- [ ] `backend/tsconfig.json`

## docs
- [ ] `docs/behavioral_design_v1.md`
- [ ] `docs/code_breakdown_plan.md`
- [ ] `docs/phase1_system_architecture_plan.md`
- [x] `docs/phase2_agent_system_design.md`
- [ ] `docs/phase3_adaptation_engine_build_slice.md`
- [ ] `docs/project_onboarding_and_phase_guide.md`
- [ ] `docs/system_invariants_v1.md`
