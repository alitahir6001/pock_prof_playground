// frontend/src/onboarding/components/YouLabel.jsx
import React from 'react';
export default function YouLabel({ children = 'You — write back' }) {
  return (
    <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2 mb-2">
      {children}
    </div>
  );
}
