// frontend/src/onboarding/components/StripedCircle.jsx
import React from 'react';

// Geometric placeholder. Use as decorative anchor on hero-ish steps.
export default function StripedCircle({ size = 84, label }) {
  return (
    <div className="inline-flex flex-col items-center gap-1.5">
      {/* color set on the svg root so currentColor resolves inside the pattern —
          pattern content does NOT inherit color from the referencing circle */}
      <svg width={size} height={size} viewBox="0 0 84 84" aria-hidden className="text-ink-2">
        <defs>
          <pattern id="ppStripes" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth="2" opacity="0.6" />
          </pattern>
        </defs>
        <circle cx="42" cy="42" r="40" fill="url(#ppStripes)" />
        <circle cx="42" cy="42" r="40" fill="none" stroke="currentColor" className="text-paper-edge" strokeWidth="1" />
      </svg>
      {label && <span className="font-mono text-[10px] uppercase tracking-wider text-ink-2">{label}</span>}
    </div>
  );
}
