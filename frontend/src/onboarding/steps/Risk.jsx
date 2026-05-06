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

  const allAcked = flags.every(f => ack[f]);

  return (
    <div className="flex flex-col gap-5 py-4">
      <CoachNote>Two things you should know before we start.</CoachNote>
      <div className="flex flex-col gap-3">
        {flags.map((f) => (
          <label key={f} className="flex gap-3 p-4 rounded-2xl bg-paper-1 border border-paper-edge cursor-pointer">
            <input
              type="checkbox"
              checked={!!ack[f]}
              onChange={() => onToggle(f)}
              className="mt-1 accent-[oklch(0.55_0.12_40)]"
            />
            <div>
              <div className="font-serif text-[16px] text-ink-0">{RISK_FLAGS[f].label}</div>
              <div className="text-[13px] text-ink-1 font-sans mt-0.5 leading-[1.5]">{RISK_FLAGS[f].body}</div>
            </div>
          </label>
        ))}
      </div>
      <div className="flex justify-end pt-2">
        <PrimaryButton onClick={onNext} disabled={!allAcked}>I understand</PrimaryButton>
      </div>
    </div>
  );
}
