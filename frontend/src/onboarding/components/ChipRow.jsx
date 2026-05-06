// frontend/src/onboarding/components/ChipRow.jsx
import React from 'react';

export default function ChipRow({ options, selected, onToggle, multi = true }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = multi ? selected.includes(o.id) : selected === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onToggle(o.id)}
            className={[
              'px-3.5 py-2 rounded-full border text-[14px] font-sans transition-colors',
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
