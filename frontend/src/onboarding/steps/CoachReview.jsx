// frontend/src/onboarding/steps/CoachReview.jsx
//
// This step only renders if primary_path === '__custom__'.
// It calls career_coach_agent on mount and shows the result.
//
// Possible coach responses (from career_coach_agent):
//   { decision: 'approved',      resolved_path_id, overlap_ratio, notes }
//   { decision: 'redirect',      resolved_path_id, overlap_ratio, notes, original_path }
//   { decision: 'needs_more_info', followup_questions: [...] }

import React, { useEffect, useState } from 'react';
import CoachNote from '../components/CoachNote';
import { PrimaryButton, GhostButton } from '../components/Button';
import { agents } from '../api';

export default function CoachReview({ state, onResolve, onBack }) {
  const [phase, setPhase] = useState('thinking');
  const [review, setReview] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPhase('thinking');
      try {
        const res = await agents.careerCoachReview({
          custom_path:    state.custom_path,
          current_skills: [...state.skills, state.skill_custom].filter(Boolean),
          schedule:       state.schedule,
          energy_bands:   state.energy,
        });
        if (cancelled) return;
        const out = res?.output ?? res;
        setReview(out);
        setPhase('done');
      } catch (e) {
        if (cancelled) return;
        setError(e.message || 'Coach is offline');
        setPhase('error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (phase === 'thinking') {
    return (
      <div className="flex flex-col gap-4 py-8 items-center text-center">
        <div className="font-mono text-[11px] uppercase tracking-wider text-ink-2">Coach reviewing</div>
        <CoachNote>
          Looking at "{state.custom_path}" against what you already know.
          One moment.
        </CoachNote>
        <div className="w-8 h-8 rounded-full border-2 border-paper-edge border-t-accent animate-spin mt-2" />
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="flex flex-col gap-4 py-6">
        <CoachNote>Couldn't reach the coach right now. Want to keep your custom direction and continue, or go back?</CoachNote>
        <div className="font-mono text-[11px] text-ink-2">{error}</div>
        <div className="flex justify-between pt-2">
          <GhostButton onClick={onBack}>Back</GhostButton>
          <PrimaryButton onClick={() => onResolve({ decision: 'kept_custom_offline', resolved_path_id: '__custom__' })}>
            Keep & continue
          </PrimaryButton>
        </div>
      </div>
    );
  }

  // phase === 'done'
  return (
    <div className="flex flex-col gap-5 py-4">
      <div className="font-mono text-[11px] uppercase tracking-wider text-ink-2">Coach review · v1</div>

      {review.decision === 'approved' && (
        <CoachNote>
          Your direction holds up. Skill overlap is {Math.round((review.overlap_ratio || 0) * 100)}% —
          enough to start. {review.notes}
        </CoachNote>
      )}

      {review.decision === 'redirect' && (
        <CoachNote>
          Close, but a tighter fit exists. Your direction overlaps {Math.round((review.overlap_ratio || 0) * 100)}% with
          existing skills. I'd point you at <em>{review.resolved_path_label || review.resolved_path_id}</em> instead.
          {review.notes && ` ${review.notes}`}
        </CoachNote>
      )}

      {review.decision === 'needs_more_info' && (
        <>
          <CoachNote>I need a bit more before I can rank this. Quick questions:</CoachNote>
          <ul className="list-disc pl-5 text-[14px] text-ink-1 font-sans">
            {(review.followup_questions || []).map((q, i) => <li key={i}>{q}</li>)}
          </ul>
        </>
      )}

      <div className="flex justify-between pt-2">
        <GhostButton onClick={onBack}>Change direction</GhostButton>
        <PrimaryButton onClick={() => onResolve(review)}>
          {review.decision === 'redirect' ? 'Take the suggestion' : 'Continue'}
        </PrimaryButton>
      </div>
    </div>
  );
}
