// frontend/src/onboarding/steps/Risk.jsx
import React from 'react';
import CoachNote from '../components/CoachNote';
import { PrimaryButton } from '../components/Button';
import { RISK_FLAGS } from '../data';

export default function Risk({ state, ack, onToggle, onNext }) {
  // Surface risks based on what we've seen.
  const flags = [];
  if (state.schedule.includes('rotating') || state.schedule.includes('on_call')) {
    flags.push('low_schedule_stability');
  }
  if (state.schedule.includes('late_close') && state.energy.length === 1) {
    flags.push('high_fatigue_pattern');
  }

  if (flags.length === 0) {
    // No risks to ack — auto-advance.
    return (
      <div className="flex flex-col gap-4 py-6">
        <CoachNote>Nothing to flag. You can keep going.</CoachNote>
        <div className="flex justify-end">
          <PrimaryButton onClick={onNext}>Continue</PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 py-4">
      <CoachNote>
        {flags.length === 1 ? 'One thing' : `${flags.length} things`} I'll keep in mind for you.
      </CoachNote>
      <div className="flex flex-col gap-3">
        {flags.map((f) => (
          <div key={f} className="p-4 rounded-2xl bg-paper-1 border border-paper-edge">
            <div className="font-serif text-[16px] text-ink-0">{RISK_FLAGS[f].label}</div>
            <div className="text-[13px] text-ink-1 font-sans mt-0.5 leading-[1.5]">{RISK_FLAGS[f].body}</div>
          </div>
        ))}
      </div>
      <div className="flex justify-end pt-2">
        <PrimaryButton onClick={onNext}>Got it</PrimaryButton>
      </div>
    </div>
  );
}
