// frontend/src/onboarding/components/ChipRow.jsx
import React from 'react';

export default function ChipRow({ options, selected, onToggle, multi = true, grid = false }) {
  // grid: fixed 3-per-row cells (for longer option sets). Otherwise: pill flow.
  const container = grid ? 'grid grid-cols-3 gap-2' : 'flex flex-wrap gap-2';
  const shape = grid
    ? 'px-2 py-2.5 rounded-xl text-[12px] leading-tight text-center min-h-[44px] flex items-center justify-center'
    : 'px-3.5 py-2 rounded-full text-[14px]';
  return (
    <div className={container}>
      {options.map((o) => {
        const active = multi ? selected.includes(o.id) : selected === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onToggle(o.id)}
            className={[
              shape,
              'border font-sans transition-colors',
              active
                ? 'bg-accent text-paper-0 border-accent'
                : 'bg-paper-1 text-ink-1 border-paper-edge hover:border-ink-2',
            ].join(' ')}
          >
            {o.label}
            {o.hint && <span className="ml-2 text-[12px] opacity-70">{o.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}
