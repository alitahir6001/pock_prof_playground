// frontend/src/onboarding/useOnboardingDraft.js
// State + persistence hook with cross-device resume.
//
// Behavior:
//   - Loads from server-side draft (GET /pilot/onboarding/draft) on mount when authed.
//   - Falls back to localStorage if the server has nothing or user is unauthed.
//   - Writes through to BOTH localStorage (immediate) and server (debounced 1.5s).
//   - On auth (post-verify), call adoptLocalDraft() to upload the local-only draft.
//   - On submit success, clears both stores.

import { useEffect, useRef, useState, useCallback } from 'react';
import { draftApi, isAuthed } from './api';
import { INITIAL_STATE, STEPS } from './data';

const LS_KEY = 'pp_onboarding_draft_v1';
const DEBOUNCE_MS = 1500;

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
  const saveTimer = useRef(null);
  const ready     = useRef(false);

  // ── Initial hydrate ──────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = readLocal();
      if (isAuthed()) {
        try {
          const remote = await draftApi.load();
          if (!cancelled && remote && remote.state_json) {
            // Server wins on conflict — it represents the latest cross-device state.
            setState({ ...INITIAL_STATE, ...remote.state_json });
            setStepIdx(remote.step_idx || 0);
            setStatus({ phase: 'idle', message: 'Resumed from server' });
            ready.current = true;
            return;
          }
        } catch (err) {
          // Fall through to local on network failure — don't block the user.
          console.warn('[onboarding] server draft load failed:', err.message);
        }
      }
      if (!cancelled && local) {
        setState({ ...INITIAL_STATE, ...local.state });
        setStepIdx(local.stepIdx || 0);
        setStatus({ phase: 'idle', message: 'Resumed locally' });
      } else if (!cancelled) {
        setStatus({ phase: 'idle', message: '' });
      }
      ready.current = true;
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Persist on every change (debounced server, immediate local) ──
  useEffect(() => {
    if (!ready.current) return;
    writeLocal({ state, stepIdx });
    if (!isAuthed()) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await draftApi.save({ state_json: state, step_idx: stepIdx });
      } catch (err) {
        // Server save failure is non-fatal — local cache holds.
        console.warn('[onboarding] server draft save failed:', err.message);
      }
    }, DEBOUNCE_MS);

    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
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

  // ── Pre-auth → post-auth migration ───────────────
  // Call this AFTER verifyCode succeeds, before navigating into the flow.
  const adoptLocalDraft = useCallback(async () => {
    const local = readLocal();
    if (!local || !isAuthed()) return;
    try {
      await draftApi.save({ state_json: local.state, step_idx: local.stepIdx });
    } catch (err) {
      console.warn('[onboarding] adopt-local failed:', err.message);
    }
  }, []);

  // ── Submit + clear ───────────────────────────────
  const clearDraft = useCallback(async () => {
    clearLocal();
    if (isAuthed()) {
      try { await draftApi.clear(); } catch {}
    }
  }, []);

  return {
    state, setField,
    stepIdx, go, goTo,
    status, setStatus,
    adoptLocalDraft, clearDraft,
  };
}
