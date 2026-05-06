// frontend/src/onboarding/components/MoonRing.jsx
import React from 'react';

// 0..1 fill — used as a phase/energy indicator.
export default function MoonRing({ value = 0.5, size = 40 }) {
  const r = size / 2 - 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" className="text-paper-edge" strokeWidth="2" />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke="currentColor" className="text-accent"
        strokeWidth="2" strokeDasharray={c}
        strokeDashoffset={c * (1 - value)}
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
    </svg>
  );
}
