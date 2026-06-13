// frontend/src/onboarding/steps/Suggestions.jsx
//
// Runs the onboarding agent right after the Direction step, then shows the
// suggested tracks as a PICKER. The user picks one for their first sprint; all
// tracks stay available to switch to later (on the plan). The agent's sprint
// suggestion pre-fills the Sprint step.

import React, { useEffect } from 'react';
import CoachNote from '../components/CoachNote';
import { PrimaryButton } from '../components/Button';
import { RATIONALE_LABEL, CAREER_OPTIONS } from '../data';
import { agents } from '../api';

export default function Suggestions({ state, phase, error, onResult, onError, onPick, onRetry, onNext, onBack }) {
  useEffect(() => {
    if (state.agent_output) return; // already have suggestions (e.g. navigated back)
    let cancelled = false;
    (async () => {
      try {
        const input = {
          schedule_constraints: state.schedule,
          energy_windows: state.energy,
          current_skills: [...state.skills, state.skill_custom].filter(Boolean),
          goal_statement: {
            interested_domains: state.domains,
            direction_note: state.direction_note || null,
          },
        };
        const res = await agents.onboarding(input);
        if (!cancelled) onResult(res, input);
      } catch (e) {
        if (!cancelled) onError(e.message || 'Could not reach the coach');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (phase === 'thinking') {
    return (
      <div className="flex flex-col gap-4 py-10 items-center text-center">
        <div className="font-mono text-[11px] uppercase tracking-wider text-ink-2">Thinking through your options</div>
        <CoachNote>Matching what you told me against paths that fit your hours and your skills. One moment.</CoachNote>
        <div className="w-8 h-8 rounded-full border-2 border-paper-edge border-t-accent animate-spin mt-2" />
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="flex flex-col gap-4 py-6">
        <CoachNote>I couldn't pull your options just now. Want to try again?</CoachNote>
        <div className="font-mono text-[11px] text-ink-2">{error}</div>
        <div className="flex justify-between pt-2">
          <button onClick={onBack} className="font-sans text-[13px] text-ink-3 hover:text-ink-1">Back</button>
          <PrimaryButton onClick={onRetry}>Try again</PrimaryButton>
        </div>
      </div>
    );
  }

  const tracks = [...((state.agent_output && state.agent_output.career_options) || [])].sort((a, b) => a.rank - b.rank);

  return (
    <div className="flex flex-col gap-5 py-4">
      <CoachNote>
        Here's where I'd start — pick the one you want your first two-week sprint to be. You can switch later.
      </CoachNote>

      <div className="flex flex-col gap-3">
        {tracks.map((t) => {
          const meta = CAREER_OPTIONS.find((o) => o.path_id === t.path_id);
          const sel = state.active_track_id === t.path_id;
          return (
            <button
              key={t.path_id}
              onClick={() => onPick(t.path_id)}
              className={[
                'w-full text-left rounded-2xl border p-4 transition-colors',
                sel ? 'bg-accent-soft border-accent' : 'bg-paper-1 border-paper-edge hover:border-ink-2',
              ].join(' ')}
            >
              <div className="flex items-center justify-between">
                <div className="font-serif text-[17px] text-ink-0">{t.title}</div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-ink-2">{sel ? '✓ picked' : `#${t.rank}`}</div>
              </div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-accent mt-1">
                {RATIONALE_LABEL[t.rationale_tag] || t.rationale_tag}
              </div>
              {meta?.blurb && <p className="text-[13px] text-ink-1 mt-2 leading-[1.6]">{meta.blurb}</p>}
            </button>
          );
        })}
      </div>

      <div className="flex justify-end pt-2">
        <PrimaryButton onClick={onNext} disabled={!state.active_track_id}>Continue</PrimaryButton>
      </div>
    </div>
  );
}
