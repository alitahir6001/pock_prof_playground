// frontend/src/onboarding/tailwind.tokens.js
// Extend your tailwind.config.js theme with these tokens.
//
// Example:
//   import ppTokens from './src/onboarding/tailwind.tokens.js';
//   export default {
//     content: [...],
//     theme: { extend: { ...ppTokens } }
//   };

const tokens = {
  colors: {
    paper: {
      0: 'oklch(0.985 0.008 80)',
      1: 'oklch(0.965 0.012 80)',
      2: 'oklch(0.94 0.018 75)',
      3: 'oklch(0.90 0.022 72)',
      edge: 'oklch(0.84 0.025 70)',
    },
    ink: {
      0: 'oklch(0.18 0.012 60)',
      1: 'oklch(0.32 0.014 60)',
      2: 'oklch(0.50 0.014 65)',
      3: 'oklch(0.66 0.012 70)',
    },
    accent: {
      DEFAULT: 'oklch(0.55 0.12 40)',
      soft:    'oklch(0.86 0.06 45)',
      deep:    'oklch(0.42 0.13 38)',
    },
  },
  fontFamily: {
    serif: ['Newsreader', 'Cormorant Garamond', 'Georgia', 'serif'],
    sans:  ['"Inter Tight"', 'system-ui', '-apple-system', 'sans-serif'],
    mono:  ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
  },
  borderColor: {
    'paper-edge': 'oklch(0.84 0.025 70)',
  },
};

export default tokens;
