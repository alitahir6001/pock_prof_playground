// frontend/src/onboarding/steps/Direction.jsx
import React from 'react';
import CoachNote from '../components/CoachNote';
import YouLabel from '../components/YouLabel';
import { PrimaryButton } from '../components/Button';
import { CAREER_OPTIONS, RATIONALE_LABEL } from '../data';

function PathCard({ opt, featured, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(opt.path_id)}
      className={[
        'w-full text-left rounded-2xl border p-4 transition-colors',
        selected ? 'bg-accent-soft border-accent' : 'bg-paper-1 border-paper-edge hover:border-ink-2',
        featured ? 'ring-1 ring-paper-edge' : '',
      ].join(' ')}
    >
      <div className="flex items-baseline justify-between">
        <div className="font-serif text-[18px] text-ink-0">{opt.title}</div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-2">
          {RATIONALE_LABEL[opt.rationale_tag] || opt.rationale_tag}
        </span>
      </div>
      <div className="mt-1.5 text-[14px] text-ink-1 font-sans leading-[1.5]">{opt.blurb}</div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-ink-2">
        <span>{opt.months_to_interview} to interview</span>
        <span>{opt.overlap} overlap</span>
        <span>{opt.starting}</span>
        <span>fit: {opt.schedule_fit}</span>
      </div>
    </button>
  );
}

export default function Direction({ value, customValue, onSelect, onCustomChange, onNext }) {
  const featured = CAREER_OPTIONS.find(o => o.rank === 1);
  const others   = CAREER_OPTIONS.filter(o => o.rank !== 1);
  const customSelected = value === '__custom__';

  return (
    <div className="flex flex-col gap-5 py-4">
      <CoachNote>Three directions, ranked by what fits you. Pick one — you can change later.</CoachNote>
      <YouLabel>You — choose your heading</YouLabel>

      <PathCard opt={featured} featured selected={value === featured.path_id} onSelect={onSelect} />
      <div className="grid grid-cols-1 gap-3">
        {others.map(o => (
          <PathCard key={o.path_id} opt={o} selected={value === o.path_id} onSelect={onSelect} />
        ))}
      </div>

      <div
        onClick={() => onSelect('__custom__')}
        className={[
          'rounded-2xl border-2 border-dashed p-4 cursor-text transition-colors',
          customSelected ? 'bg-paper-2 border-accent' : 'bg-paper-0 border-paper-edge',
        ].join(' ')}
      >
        <div className="font-mono text-[10px] uppercase tracking-wider text-ink-2 mb-1.5">
          None of these · point your own way
        </div>
        <input
          value={customValue}
          onChange={(e) => { onSelect('__custom__'); onCustomChange(e.target.value); }}
          placeholder="e.g. I want to do something with maps and cities"
          className="w-full bg-transparent font-serif text-[16px] text-ink-0 placeholder:text-ink-3 focus:outline-none"
        />
        {customSelected && (
          <div className="mt-2 font-mono text-[10px] text-ink-2">
            We'll have the coach review this for skill overlap before locking it in.
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <PrimaryButton
          onClick={onNext}
          disabled={!value || (value === '__custom__' && customValue.trim().length < 4)}
        >Continue</PrimaryButton>
      </div>
    </div>
  );
}
