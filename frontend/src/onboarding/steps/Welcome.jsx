// frontend/src/onboarding/steps/Welcome.jsx
import React from 'react';
import CoachNote from '../components/CoachNote';
import StripedCircle from '../components/StripedCircle';
import { PrimaryButton } from '../components/Button';

export default function Welcome({ onNext }) {
  return (
    <div className="flex flex-col gap-7 py-6">
      <StripedCircle size={72} label="POCKET PROFESSOR" />
      <CoachNote sign="P">
        I won't tell you this is easy. I won't promise a new career in 30 days.
        I will help you find the next small thing you can do — tonight, after
        your shift — and the one after that.
      </CoachNote>
      <div className="text-ink-2 text-[14px] font-sans leading-[1.6]">
        Five minutes now. We'll save your answers as you go.
      </div>
      <div className="flex items-center justify-end pt-2">
        <PrimaryButton onClick={onNext}>Begin</PrimaryButton>
      </div>
    </div>
  );
}
