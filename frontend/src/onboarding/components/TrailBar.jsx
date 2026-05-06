// frontend/src/onboarding/components/TrailBar.jsx
import React from 'react';
import { STEPS } from '../data';

const VISIBLE = STEPS.filter(s => !['welcome','done'].includes(s));

export default function TrailBar({ stepId }) {
  if (['welcome','done'].includes(stepId)) return null;
  const idx = VISIBLE.indexOf(stepId);
  return (
    <div className="flex items-center gap-1.5 px-1">
      {VISIBLE.map((s, i) => (
        <span
          key={s}
          className={[
            'h-[3px] rounded-full transition-all',
            i < idx  ? 'w-4 bg-ink-1' :
            i === idx ? 'w-8 bg-accent' :
                        'w-4 bg-paper-edge',
          ].join(' ')}
        />
      ))}
    </div>
  );
}
