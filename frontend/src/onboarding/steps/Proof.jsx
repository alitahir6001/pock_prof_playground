// frontend/src/onboarding/steps/Proof.jsx
import React from 'react';
import CoachNote from '../components/CoachNote';
import { PrimaryButton } from '../components/Button';

export default function Proof({ onSubmit, submitting }) {
  return (
    <div className="flex flex-col gap-5 py-4">
      <CoachNote>
        Your first task isn't reading. It's a five-minute thing tonight: a tiny
        proof you can do something in your new direction. We'll set it now and
        send it when your trigger fires.
      </CoachNote>
      <div className="rounded-2xl bg-paper-2 border border-paper-edge p-4">
        <div className="font-mono text-[10px] uppercase tracking-wider text-ink-2 mb-1">Your first bite-size win · day 1</div>
        <div className="font-serif text-[18px] text-ink-0 leading-[1.4]">
          Find one beginner resource and bookmark it. Don't start it — just locate it.
          That's the whole thing.
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <PrimaryButton onClick={onSubmit} disabled={submitting}>
          {submitting ? 'Sending to coach…' : 'Lock it in'}
        </PrimaryButton>
      </div>
    </div>
  );
}
