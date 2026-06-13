// frontend/src/onboarding/OnboardingFlow.jsx
//
// Drop-in onboarding entrypoint. Mount behind your auth gate.
//
//   <OnboardingFlow onComplete={(plan) => ...} />
//
// Flow: intake (schedule/energy/skills/domains) → AI suggests tracks (Suggestions
// step, a picker) → sprint/risk/trigger → done. The agent runs MID-flow so the
// user picks a track before configuring the sprint; all tracks stay switchable
// later on the plan (App).

import React, { useState, useMemo, useCallback } from 'react';
import { useOnboardingDraft } from './useOnboardingDraft';
import { STEPS } from './data';

import TrailBar      from './components/TrailBar';
import { BackChevron } from './components/Button';

import Welcome      from './steps/Welcome';
import Schedule     from './steps/Schedule';
import Energy       from './steps/Energy';
import Skills       from './steps/Skills';
import Direction    from './steps/Direction';
import Suggestions  from './steps/Suggestions';
import Sprint       from './steps/Sprint';
import Risk         from './steps/Risk';
import Trigger      from './steps/Trigger';
import Done         from './steps/Done';

export default function OnboardingFlow({ onComplete }) {
  const draft = useOnboardingDraft();
  const { state, setField, stepIdx, go, status, clearDraft } = draft;

  // Suggestions (mid-flow AI) phase. Derived to 'done' whenever we already have output.
  const [sugPhase, setSugPhase] = useState('thinking');
  const [sugError, setSugError] = useState(null);
  const [sugKey, setSugKey] = useState(0); // bump to retry the AI call

  const stepId = STEPS[stepIdx];

  const advance = useCallback(() => go(1), [go]);
  const back = useCallback(() => go(-1), [go]);

  const handleSuggestionResult = useCallback((res, input) => {
    const out = res.output || res;
    setField('agent_output', out);
    setField('agent_input', input);
    setField('interaction_id', res.interaction_id || null);
    const top = (out.career_options || []).slice().sort((a, b) => a.rank - b.rank)[0];
    if (top) setField('active_track_id', top.path_id);
    // pre-fill the sprint step from the AI's suggestion (user can still adjust)
    const sr = out.sprint_recommendation || {};
    if (sr.daily_minutes_target) setField('daily_min', sr.daily_minutes_target);
    if (sr.emphasis) setField('emphasis', sr.emphasis);
    setSugPhase('done');
  }, [setField]);

  const buildPlan = useCallback(() => ({
    tracks: state.agent_output?.career_options || [],
    active_track_id: state.active_track_id,
    interaction_id: state.interaction_id,
    agent_input: state.agent_input,    // lets the plan regenerate on thumbs-down
    agent_output: state.agent_output,  // risk_flags, next_actions, etc.
    sprint: { daily_minutes_target: state.daily_min, duration_days: 14, emphasis: state.emphasis },
    triggers: { primary_trigger: state.primary_trig, fallback_trigger: state.fallback_trig },
  }), [state]);

  const finish = useCallback(() => {
    clearDraft();
    onComplete?.(buildPlan());
  }, [clearDraft, onComplete, buildPlan]);

  const summary = useMemo(() => ({
    daily_min:     state.daily_min,
    primary_trig:  state.primary_trig,
    fallback_trig: state.fallback_trig,
  }), [state]);

  if (status.phase === 'loading') {
    return (
      <div className="min-h-screen bg-paper-0 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-paper-edge border-t-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-0 text-ink-0 font-sans">
      <div className="mx-auto max-w-[440px] px-5 pt-4 pb-10">
        <header className="flex items-center gap-3 h-12">
          {stepIdx > 0 && stepId !== 'done' ? <BackChevron onClick={back} /> : <div className="w-9" />}
          <div className="flex-1"><TrailBar stepId={stepId} /></div>
          <div className="w-9" />
        </header>

        <main>
          {stepId === 'welcome' && (
            <Welcome onNext={advance} />
          )}
          {stepId === 'schedule' && (
            <Schedule value={state.schedule} onChange={(v) => setField('schedule', v)} onNext={advance} />
          )}
          {stepId === 'energy' && (
            <Energy value={state.energy} onChange={(v) => setField('energy', v)} onNext={advance} />
          )}
          {stepId === 'skills' && (
            <Skills
              value={state.skills} custom={state.skill_custom}
              onChange={(v) => setField('skills', v)}
              onCustomChange={(v) => setField('skill_custom', v)}
              onNext={advance}
            />
          )}
          {stepId === 'direction' && (
            <Direction
              domains={state.domains}
              note={state.direction_note}
              onToggleDomain={(id) =>
                setField('domains', state.domains.includes(id)
                  ? state.domains.filter((x) => x !== id)
                  : [...state.domains, id])}
              onNote={(v) => setField('direction_note', v)}
              onNext={advance}
            />
          )}
          {stepId === 'suggestions' && (
            <Suggestions
              key={sugKey}
              state={state}
              phase={state.agent_output ? 'done' : sugPhase}
              error={sugError}
              onResult={handleSuggestionResult}
              onError={(msg) => { setSugError(msg); setSugPhase('error'); }}
              onPick={(id) => setField('active_track_id', id)}
              onRetry={() => { setSugError(null); setSugPhase('thinking'); setSugKey((k) => k + 1); }}
              onNext={advance}
              onBack={back}
            />
          )}
          {stepId === 'sprint' && (
            <Sprint
              minutes={state.daily_min} emphasis={state.emphasis}
              onMinutes={(v) => setField('daily_min', v)}
              onEmphasis={(v) => setField('emphasis', v)}
              onNext={advance}
            />
          )}
          {stepId === 'risk' && (
            <Risk
              state={state} ack={state.risks_ack}
              onToggle={(f) => setField('risks_ack', { ...state.risks_ack, [f]: !state.risks_ack[f] })}
              onNext={advance}
            />
          )}
          {stepId === 'trigger' && (
            <Trigger
              primary={state.primary_trig} fallback={state.fallback_trig}
              onPrimary={(v) => setField('primary_trig', v)}
              onFallback={(v) => setField('fallback_trig', v)}
              onNext={advance}
            />
          )}
          {stepId === 'done' && (
            <Done summary={summary} onContinue={finish} />
          )}
        </main>

        <footer className="mt-10 text-[11px] font-mono text-ink-3">
          <span>Pocket Professor · onboarding v1</span>
        </footer>
      </div>
    </div>
  );
}
