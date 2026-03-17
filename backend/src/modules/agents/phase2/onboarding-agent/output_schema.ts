import { z } from "zod";

const careerOptionSchema = z.object({
  path_id: z.string().min(1),
  title: z.string().min(1),
  rank: z.number().int().min(1).max(3),
  rationale_tag: z.enum([
    "high_overlap",
    "fast_interview_path",
    "schedule_compatible",
    "entry_level_accessible"
  ])
});

export const onboardingAgentOutputSchema = z.object({
  agent: z.literal("onboarding_agent"),
  schema_version: z.literal("1.0.0"),
  career_options: z.array(careerOptionSchema).length(3),
  trigger_plan: z.object({
    primary_trigger: z.string().min(3).max(120),
    fallback_trigger: z.string().min(3).max(120)
  }),
  sprint_recommendation: z.object({
    duration_days: z.literal(14),
    daily_minutes_target: z.number().int().min(10).max(60),
    emphasis: z.enum(["micro_proof", "foundational_skills", "schedule_stability"])
  }),
  risk_flags: z.array(z.enum([
    "low_schedule_stability",
    "high_fatigue_pattern",
    "directional_ambiguity",
    "insufficient_skill_overlap"
  ])).max(4),
  next_actions: z.array(z.string().min(5).max(140)).min(2).max(3)
});

export type OnboardingAgentOutput = z.infer<typeof onboardingAgentOutputSchema>;
