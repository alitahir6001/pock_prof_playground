// frontend/src/onboarding/steps/Skills.jsx
import React from 'react';
import CoachNote from '../components/CoachNote';
import YouLabel from '../components/YouLabel';
import ChipRow from '../components/ChipRow';
import { PrimaryButton } from '../components/Button';
import { SKILLS } from '../data';

export default function Skills({ value, custom, onChange, onCustomChange, onNext }) {
  const toggle = (id) =>
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);
  return (
    <div className="flex flex-col gap-6 py-4">
      <CoachNote>What are you already good at — even if it doesn't feel like a "skill"?</CoachNote>
      <YouLabel>You — write back</YouLabel>
      <ChipRow options={SKILLS} selected={value} onToggle={toggle} />
      <div>
        <YouLabel>Anything else, in your words</YouLabel>
        <textarea
          value={custom}
          onChange={(e) => onCustomChange(e.target.value)}
          placeholder="e.g. I can read a room in 5 seconds and adjust my pitch."
          className="w-full min-h-[88px] bg-paper-1 border border-paper-edge rounded-2xl p-3 font-sans text-[14px] text-ink-0 placeholder:text-ink-3 focus:outline-none focus:border-ink-2"
        />
      </div>
      <div className="flex justify-end pt-2">
        <PrimaryButton onClick={onNext} disabled={value.length === 0 && !custom.trim()}>Continue</PrimaryButton>
      </div>
    </div>
  );
}
