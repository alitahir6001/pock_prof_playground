// frontend/src/onboarding/steps/Trigger.jsx
import React from 'react';
import CoachNote from '../components/CoachNote';
import YouLabel from '../components/YouLabel';
import { PrimaryButton } from '../components/Button';
import { TRIGGER_SUGGESTIONS_PRIMARY, TRIGGER_SUGGESTIONS_FALLBACK } from '../data';

function TriggerField({ label, value, onChange, suggestions, placeholder }) {
  return (
    <div>
      <YouLabel>{label}</YouLabel>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 120))}
        placeholder={placeholder}
        className="w-full min-h-[64px] bg-paper-1 border border-paper-edge rounded-2xl p-3 font-serif text-[16px] text-ink-0 placeholder:text-ink-3 focus:outline-none focus:border-ink-2"
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {suggestions.map(s => (
          <button
            key={s}
            onClick={() => onChange(s)}
            className="font-sans text-[12px] px-2.5 py-1 rounded-full bg-paper-0 border border-paper-edge text-ink-2 hover:border-ink-2"
          >
            {s}
          </button>
        ))}
      </div>
      <div className="mt-1 font-mono text-[10px] text-ink-3 text-right">{value.length}/120</div>
    </div>
  );
}

export function ReminderTimeField({ value, onChange }) {
  return (
    <div>
      <YouLabel>Remind me around</YouLabel>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-paper-1 border border-paper-edge rounded-2xl p-3 font-serif text-[16px] text-ink-0 focus:outline-none focus:border-ink-2"
      />
      <div className="mt-1 font-sans text-[12px] text-ink-3">
        One email a day around this time, and none on days you've already done your session.
      </div>
    </div>
  );
}

export default function Trigger({ primary, fallback, reminderTime, onPrimary, onFallback, onReminderTime, onNext }) {
  const ok = primary.trim().length >= 3 && fallback.trim().length >= 3 && /^\d{2}:\d{2}$/.test(reminderTime);
  return (
    <div className="flex flex-col gap-5 py-4">
      <CoachNote>
        We need two cues. <em>After [event]</em> I will <em>open Pocket Professor</em>.
        One for normal days, one for chaos days.
      </CoachNote>

      <TriggerField
        label="Primary — for normal days"
        value={primary}
        onChange={onPrimary}
        suggestions={TRIGGER_SUGGESTIONS_PRIMARY}
        placeholder="After my first coffee on a closing day…"
      />

      <ReminderTimeField value={reminderTime} onChange={onReminderTime} />

      <TriggerField
        label="Fallback — for chaos days"
        value={fallback}
        onChange={onFallback}
        suggestions={TRIGGER_SUGGESTIONS_FALLBACK}
        placeholder="On the bus going to work…"
      />

      <div className="flex justify-end pt-2">
        <PrimaryButton onClick={onNext} disabled={!ok}>Continue</PrimaryButton>
      </div>
    </div>
  );
}
