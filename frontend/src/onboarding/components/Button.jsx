// frontend/src/onboarding/components/Button.jsx
import React from 'react';

export function PrimaryButton({ children, disabled, ...rest }) {
  return (
    <button
      {...rest}
      disabled={disabled}
      className={[
        'px-5 py-3 rounded-full font-sans text-[15px] transition-colors',
        disabled
          ? 'bg-paper-2 text-ink-3 cursor-not-allowed'
          : 'bg-ink-0 text-paper-0 hover:bg-accent-deep',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, ...rest }) {
  return (
    <button
      {...rest}
      className="px-4 py-3 rounded-full font-sans text-[14px] text-ink-2 hover:text-ink-0"
    >
      {children}
    </button>
  );
}

export function BackChevron({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back"
      className="w-9 h-9 rounded-full flex items-center justify-center text-ink-2 hover:text-ink-0 hover:bg-paper-2"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M9 2 L4 7 L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
