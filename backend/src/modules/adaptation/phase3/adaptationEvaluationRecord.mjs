/**
 * Builds persistence-ready adaptation_evaluations record payload.
 * This is an adapter-only scaffold (no DB IO in this slice).
 */

/**
 * @param {object} params
 * @param {string} params.user_id
 * @param {string} params.evaluated_at
 * @param {object} params.engine_output
 * @param {string} params.trigger_window
 * @param {object} params.previous_state
 * @param {object} params.new_state
 */
export function buildAdaptationEvaluationRecord(params) {
  if (!params || typeof params !== 'object') {
    throw new Error('params are required.');
  }

  if (typeof params.user_id !== 'string' || params.user_id.length < 1) {
    throw new Error('user_id is required.');
  }

  if (typeof params.evaluated_at !== 'string' || Number.isNaN(Date.parse(params.evaluated_at))) {
    throw new Error('evaluated_at must be valid ISO timestamp.');
  }

  const out = params.engine_output;
  if (!out || typeof out !== 'object') {
    throw new Error('engine_output is required.');
  }

  const eventsUsed = out.mutations.flatMap((m) => m.events_used || []);

  return {
    user_id: params.user_id,
    evaluation_time: params.evaluated_at,
    trigger_window: params.trigger_window,
    events_used_json: Array.from(new Set(eventsUsed)),
    applied_rule_ids_json: out.applied_rules,
    mutations_json: out.mutations,
    previous_state_json: params.previous_state,
    new_state_json: params.new_state,
    deferred_mutations_json: out.deferred_mutations || []
  };
}
