// frontend/src/onboarding/components/CoachNote.jsx
import React from 'react';

export default function CoachNote({ children, sign = null }) {
  return (
    <div className="font-serif text-ink-0 text-[19px] leading-[1.55]">
      {children}
      {sign && <div className="mt-3 italic text-ink-2 text-[15px]">— {sign}</div>}
    </div>
  );
}
