// frontend/src/onboarding/useOnboardingDraft.js
// State + persistence hook — localStorage-only for the pilot.
//
// Server-side cross-device resume was intentionally dropped for the pilot:
// there is no /pilot/onboarding/draft route (draft persistence deferred
// post-pilot). Drafts live in localStorage only, so a user completes
// onboarding on one device; an unfinished draft resumes on that same device.

import { useEffect, useRef, useState, useCallback } from 'react';
import { INITIAL_STATE, STEPS } from './data';

// v2: onboarding state shape changed (domains/direction_note replaced the
// path-picker). Bumping the key invalidates incompatible v1 drafts.
const LS_KEY = 'pp_onboarding_draft_v2';

function readLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeLocal(payload) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(payload)); } catch {}
}

function clearLocal() {
  try { localStorage.removeItem(LS_KEY); } catch {}
}

export function useOnboardingDraft() {
  const [state, setState]     = useState(INITIAL_STATE);
  const [stepIdx, setStepIdx] = useState(0);
  const [status, setStatus]   = useState({ phase: 'loading', message: '' });
  const ready = useRef(false);

  // ── Hydrate from localStorage once ───────────────
  useEffect(() => {
    const local = readLocal();
    if (local) {
      setState({ ...INITIAL_STATE, ...local.state });
      setStepIdx(local.stepIdx || 0);
      setStatus({ phase: 'idle', message: 'Resumed' });
    } else {
      setStatus({ phase: 'idle', message: '' });
    }
    ready.current = true;
  }, []);

  // ── Persist to localStorage on every change ──────
  useEffect(() => {
    if (!ready.current) return;
    writeLocal({ state, stepIdx });
  }, [state, stepIdx]);

  // ── Field setter ─────────────────────────────────
  const setField = useCallback((key, value) => {
    setState((s) => {
      if (typeof value === 'function') return { ...s, [key]: value(s[key]) };
      return { ...s, [key]: value };
    });
  }, []);

  // ── Step navigation ──────────────────────────────
  const go = useCallback((delta) => {
    setStepIdx((i) => Math.max(0, Math.min(STEPS.length - 1, i + delta)));
  }, []);

  const goTo = useCallback((id) => {
    const i = STEPS.indexOf(id);
    if (i >= 0) setStepIdx(i);
  }, []);

  // ── Clear on submit success ──────────────────────
  const clearDraft = useCallback(() => { clearLocal(); }, []);

  return {
    state, setField,
    stepIdx, go, goTo,
    status, setStatus,
    clearDraft,
  };
}
