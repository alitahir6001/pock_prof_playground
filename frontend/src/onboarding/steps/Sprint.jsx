// frontend/src/onboarding/steps/Sprint.jsx
import React from 'react';
import CoachNote from '../components/CoachNote';
import YouLabel from '../components/YouLabel';
import { PrimaryButton } from '../components/Button';

const EMPHASIS = [
  { id: 'micro_proof',   label: 'Micro-proofs',   hint: 'small wins, fast' },
  { id: 'depth',         label: 'Depth study',    hint: 'fewer, longer' },
  { id: 'mixed',         label: 'Mixed',          hint: 'both, balanced' },
];

export default function Sprint({ minutes, emphasis, onMinutes, onEmphasis, onNext }) {
  return (
    <div className="flex flex-col gap-6 py-4">
      <CoachNote>Two weeks. How much per day?</CoachNote>

      <div>
        <YouLabel>Daily minutes</YouLabel>
        <div className="flex items-baseline gap-3">
          <input
            type="range" min={10} max={60} step={5}
            value={minutes}
            onChange={(e) => onMinutes(Number(e.target.value))}
            className="flex-1 accent-[oklch(0.55_0.12_40)]"
          />
          <div className="font-serif text-[28px] text-ink-0 w-16 text-right">{minutes}m</div>
        </div>
        <div className="mt-1 font-mono text-[11px] text-ink-2">
          {minutes <= 15 ? 'Honest start. Keeps the streak alive on bad days.' :
           minutes <= 30 ? 'Sustainable for shift work.' :
                          'Ambitious — only if your shifts allow.'}
        </div>
      </div>

      <div>
        <YouLabel>Emphasis</YouLabel>
        <div className="grid grid-cols-3 gap-2">
          {EMPHASIS.map(e => (
            <button
              key={e.id}
              onClick={() => onEmphasis(e.id)}
              className={[
                'rounded-2xl border p-3 text-left',
                emphasis === e.id ? 'bg-accent-soft border-accent' : 'bg-paper-1 border-paper-edge hover:border-ink-2',
              ].join(' ')}
            >
              <div className="font-serif text-[15px] text-ink-0">{e.label}</div>
              <div className="font-mono text-[10px] text-ink-2 mt-0.5">{e.hint}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <PrimaryButton onClick={onNext}>Continue</PrimaryButton>
      </div>
    </div>
  );
}
