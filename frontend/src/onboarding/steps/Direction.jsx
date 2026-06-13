// frontend/src/onboarding/steps/Direction.jsx
import React from 'react';
import CoachNote from '../components/CoachNote';
import YouLabel from '../components/YouLabel';
import { PrimaryButton } from '../components/Button';
import { DOMAINS } from '../data';

export default function Direction({ domains, note, onToggleDomain, onNote, onNext }) {
  const has = (id) => domains.includes(id);
  const ok = domains.length > 0 || note.trim().length >= 3;

  return (
    <div className="flex flex-col gap-5 py-4">
      <CoachNote>What career domains pull at you?</CoachNote>
      <div className="-mt-2 text-ink-2 text-[14px] font-sans leading-[1.6]">
        Tap any that spark something — pick a few. Not sure what you want? Tell me what
        you'd rather avoid. You don't need to know the exact job; I'll do that part.
      </div>

      <div className="flex flex-wrap gap-2">
        {DOMAINS.map((d) => (
          <button
            key={d.id}
            onClick={() => onToggleDomain(d.id)}
            className={[
              'rounded-full border px-3.5 py-2 text-[14px] transition-colors',
              has(d.id)
                ? 'bg-accent-soft border-accent text-ink-0'
                : 'bg-paper-1 border-paper-edge text-ink-1 hover:border-ink-2',
            ].join(' ')}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div>
        <YouLabel>In your words</YouLabel>
        <textarea
          value={note}
          onChange={(e) => onNote(e.target.value.slice(0, 200))}
          placeholder="e.g. something with computers, but not phone support — or just 'anything but late nights'"
          className="w-full min-h-[72px] bg-paper-1 border border-paper-edge rounded-2xl p-3 font-serif text-[16px] text-ink-0 placeholder:text-ink-3 focus:outline-none focus:border-ink-2"
        />
        <div className="mt-1 font-mono text-[10px] text-ink-3 text-right">{note.length}/200</div>
      </div>

      <div className="flex justify-end pt-2">
        <PrimaryButton onClick={onNext} disabled={!ok}>Continue</PrimaryButton>
      </div>
    </div>
  );
}
