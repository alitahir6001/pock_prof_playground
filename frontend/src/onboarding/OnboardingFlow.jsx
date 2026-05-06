// frontend/src/onboarding/OnboardingFlow.jsx
//
// Drop-in onboarding entrypoint. Mount at /onboarding behind your auth gate.
//
// import OnboardingFlow from './onboarding/OnboardingFlow';
// <OnboardingFlow onComplete={() => navigate('/dashboard')} />

import React, { useState, useMemo, useCallback } from 'react';
import { useOnboardingDraft } from './useOnboardingDraft';
import { STEPS, CAREER_OPTIONS } from './data';
import { agents } from './api';

import TrailBar      from './components/TrailBar';
import { BackChevron } from './components/Button';

import Welcome      from './steps/Welcome';
import Schedule     from './steps/Schedule';
import Energy       from './steps/Energy';
import Skills       from './steps/Skills';
import Direction    from './steps/Direction';
import CoachReview  from './steps/CoachReview';
import Sprint       from './steps/Sprint';
import Risk         from './steps/Risk';
import Trigger      from './steps/Trigger';
import Proof        from './steps/Proof';
import Done         from './steps/Done';

export default function OnboardingFlow({ onComplete }) {
  const draft = useOnboardingDraft();
  const { state, setField, stepIdx, go, goTo, status, clearDraft } = draft;

  const [submitting, setSubmitting] = useState(false);
  const [agentResult, setAgentResult] = useState(null);

  const stepId = STEPS[stepIdx];

  // Skip CoachReview if not on a custom path.
  const advance = useCallback(() => {
    const next = STEPS[stepIdx + 1];
    if (next === 'coachReview' && state.primary_path !== '__custom__') {
      goTo('sprint');
      return;
    }
    go(1);
  }, [stepIdx, state.primary_path, go, goTo]);

  const back = useCallback(() => {
    const prev = STEPS[stepIdx - 1];
    if (prev === 'coachReview' && state.primary_path !== '__custom__') {
      goTo('direction');
      return;
    }
    go(-1);
  }, [stepIdx, state.primary_path, go, goTo]);

  const onSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const resolvedPathId =
        state.primary_path === '__custom__'
          ? (state.coach_review?.resolved_path_id || '__custom__')
          : state.primary_path;

      const input = {
        schedule_constraints: state.schedule,
        energy_windows:       state.energy,
        current_skills:       [...state.skills, state.skill_custom].filter(Boolean),
        goal_statement: {
          primary_path_id:  resolvedPathId,
          custom_path_text: state.primary_path === '__custom__' ? state.custom_path : null,
          path_source:      state.primary_path === '__custom__'
                              ? 'custom_with_coach_review'
                              : 'ranked_option',
          coach_decision:   state.coach_review?.decision || null,
        },
        daily_minutes_target:  state.daily_min,
        sprint_emphasis:       state.emphasis,
        risk_acknowledgements: state.risks_ack,
        trigger_plan: {
          primary_trigger:  state.primary_trig,
          fallback_trigger: state.fallback_trig,
        },
      };

      const res = await agents.onboarding(input);
      setAgentResult(res?.output ?? res);
      await clearDraft();
      goTo('done');
    } catch (e) {
      alert(`Couldn't save your onboarding: ${e.message}\nYour answers are still saved locally — try again in a moment.`);
    } finally {
      setSubmitting(false);
    }
  }, [state, clearDraft, goTo]);

  const summary = useMemo(() => {
    const resolvedId =
      state.primary_path === '__custom__'
        ? (state.coach_review?.resolved_path_id || '__custom__')
        : state.primary_path;
    const opt = CAREER_OPTIONS.find(o => o.path_id === resolvedId);
    return {
      path_label:    opt?.title || state.custom_path || 'Custom direction',
      daily_min:     state.daily_min,
      primary_trig:  state.primary_trig,
      fallback_trig: state.fallback_trig,
    };
  }, [state]);

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
              value={state.primary_path} customValue={state.custom_path}
              onSelect={(id) => setField('primary_path', id)}
              onCustomChange={(v) => setField('custom_path', v)}
              onNext={advance}
            />
          )}
          {stepId === 'coachReview' && (
            <CoachReview
              state={state}
              onResolve={(review) => { setField('coach_review', review); advance(); }}
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
          {stepId === 'proof' && (
            <Proof onSubmit={onSubmit} submitting={submitting} />
          )}
          {stepId === 'done' && (
            <Done summary={summary} onContinue={() => onComplete?.(agentResult)} />
          )}
        </main>

        <footer className="mt-10 flex items-center justify-between text-[11px] font-mono text-ink-3">
          <span>Pocket Professor · onboarding v1</span>
          <span>{status.message}</span>
        </footer>
      </div>
    </div>
  );
}
