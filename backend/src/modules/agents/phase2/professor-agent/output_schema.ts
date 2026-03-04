import { z } from "zod";

const optionSchema = z.object({
  option_id: z.string().min(1),
  rank: z.number().int().min(1).max(3),
  label: z.enum(["best_next", "easier_fallback", "catch_up"]),
  task_summary: z.string().min(8).max(180),
  estimated_minutes: z.number().int().min(10).max(60),
  proof_expected: z.boolean()
});

export const professorAgentOutputSchema = z.object({
  agent: z.literal("professor_agent"),
  schema_version: z.literal("1.0.0"),
  session_objective: z.string().min(10).max(180),
  options: z.array(optionSchema).min(2).max(3),
  resistance_signal: z.enum(["none", "topic_resistance", "fatigue_friction", "choice_overload"]),
  escalation_recommendation: z.enum(["none", "career_coach_review", "resilience_coach_review"]),
  next_actions: z.array(z.string().min(5).max(140)).length(2)
});

export type ProfessorAgentOutput = z.infer<typeof professorAgentOutputSchema>;
