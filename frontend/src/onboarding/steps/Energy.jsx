// frontend/src/onboarding/steps/Energy.jsx
import React from 'react';
import CoachNote from '../components/CoachNote';
import YouLabel from '../components/YouLabel';
import MoonRing from '../components/MoonRing';
import { PrimaryButton } from '../components/Button';
import { BANDS } from '../data';

export default function Energy({ value, onChange, onNext }) {
  const toggle = (id) =>
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);
  return (
    <div className="flex flex-col gap-6 py-4">
      <CoachNote>When does your brain work best?</CoachNote>
      <div className="text-ink-2 text-[13px] font-sans">Tap the windows you're sharpest. We'll only schedule hard tasks here.</div>
      <YouLabel>You — write back</YouLabel>
      <div className="grid grid-cols-2 gap-2">
        {BANDS.map((b) => {
          const on = value.includes(b.id);
          return (
            <button
              key={b.id}
              onClick={() => toggle(b.id)}
              className={[
                'flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-colors',
                on ? 'bg-accent-soft border-accent' : 'bg-paper-1 border-paper-edge hover:border-ink-2',
              ].join(' ')}
            >
              <MoonRing value={on ? 1 : 0.15} size={28} />
              <div>
                <div className="font-serif text-[16px] text-ink-0">{b.label}</div>
                <div className="font-mono text-[11px] text-ink-2">{b.range}</div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex justify-end pt-2">
        <PrimaryButton onClick={onNext} disabled={value.length === 0}>Continue</PrimaryButton>
      </div>
    </div>
  );
}
