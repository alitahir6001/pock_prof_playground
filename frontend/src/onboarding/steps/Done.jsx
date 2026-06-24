// frontend/src/onboarding/steps/Done.jsx
import React from 'react';
import CoachNote from '../components/CoachNote';
import { PrimaryButton } from '../components/Button';

export default function Done({ summary, onContinue }) {
  return (
    <div className="flex flex-col gap-5 py-4">
      <div className="font-mono text-[11px] uppercase tracking-wider text-ink-2">Tomorrow's marker</div>
      <CoachNote>
        We've got it. Go rest. Tomorrow your trigger fires; I'll be here with the smallest possible thing.
      </CoachNote>
      <div className="rounded-2xl bg-paper-2 border border-paper-edge p-4 text-[14px] text-ink-1 font-sans leading-[1.6]">
        <div><strong>Cadence:</strong> {summary.daily_min} min/day · 14 days</div>
        <div><strong>Cue:</strong> {summary.primary_trig}</div>
        <div><strong>Backup cue:</strong> {summary.fallback_trig}</div>
      </div>
      <div className="flex justify-end pt-2">
        <PrimaryButton onClick={onContinue}>See my plan</PrimaryButton>
      </div>
    </div>
  );
}
