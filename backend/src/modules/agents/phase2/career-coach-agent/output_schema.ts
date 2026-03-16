import { z } from "zod";

const pivotOptionSchema = z.object({
  path_id: z.string().min(1),
  title: z.string().min(1),
  rank: z.number().int().min(1).max(3),
  overlap_ratio_preserved: z.number().min(0).max(1),
  eta_delta_days: z.number().int().min(-365).max(365)
});

export const careerCoachAgentOutputSchema = z.object({
  agent: z.literal("career_coach_agent"),
  schema_version: z.literal("1.0.0"),
  recommendation_type: z.enum([
    "stay_course",
    "pivot_preview",
    "pivot_candidate_requires_confirmation"
  ]),
  rationale_tag: z.enum([
    "high_overlap_preserved",
    "directional_ambiguity_detected",
    "interview_readiness_stall",
    "market_gap_pressure"
  ]),
  pivot_options: z.array(pivotOptionSchema).max(3),
  preserved_progress_summary: z.string().min(10).max(220),
  next_actions: z.array(z.string().min(5).max(140)).length(2)
});

export type CareerCoachAgentOutput = z.infer<typeof careerCoachAgentOutputSchema>;
