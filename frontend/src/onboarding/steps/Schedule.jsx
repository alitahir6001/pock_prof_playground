// frontend/src/onboarding/steps/Schedule.jsx
import React from 'react';
import CoachNote from '../components/CoachNote';
import YouLabel from '../components/YouLabel';
import ChipRow from '../components/ChipRow';
import { PrimaryButton } from '../components/Button';
import { SCHEDULES } from '../data';

export default function Schedule({ value, onChange, onNext }) {
  const toggle = (id) =>
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);
  return (
    <div className="flex flex-col gap-6 py-4">
      <CoachNote>What does your week actually look like?</CoachNote>
      <div className="text-ink-2 text-[13px] font-sans">Pick all that apply. Be honest — chaos is data.</div>
      <div>
        <YouLabel>You — write back</YouLabel>
        <ChipRow options={SCHEDULES} selected={value} onToggle={toggle} />
      </div>
      <div className="flex justify-end pt-2">
        <PrimaryButton onClick={onNext} disabled={value.length === 0}>Continue</PrimaryButton>
      </div>
    </div>
  );
}
