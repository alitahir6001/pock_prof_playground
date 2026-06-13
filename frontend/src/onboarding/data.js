// frontend/src/onboarding/data.js
// Static taxonomies. Replace with API-driven data when your catalog is live.

export const SCHEDULES = [
  { id: 'late_close',  label: 'Closing shifts',  hint: 'Ending 11pm – 3am' },
  { id: 'early_open',  label: 'Opening shifts',  hint: 'Starting 4am – 7am' },
  { id: 'doubles',     label: 'Doubles / split', hint: 'Two shifts, gap between' },
  { id: 'rotating',    label: 'Rotating',        hint: 'Different week to week' },
  { id: 'on_call',     label: 'On-call / gig',   hint: 'No fixed pattern' },
  { id: 'weekends',    label: 'Mostly weekends', hint: 'Fri–Sun heavy' },
];

export const SKILLS = [
  { id: 'multitask',     label: 'High-stakes multitasking' },
  { id: 'people',        label: 'Reading people fast' },
  { id: 'cash_systems',  label: 'POS / cash handling' },
  { id: 'training',      label: 'Training new staff' },
  { id: 'inventory',     label: 'Inventory / ordering' },
  { id: 'conflict',      label: 'De-escalating conflict' },
  { id: 'teamwork',      label: 'Working tired teams' },
  { id: 'logistics',     label: 'Scheduling logistics' },
  { id: 'spanish',       label: 'Bilingual' },
  { id: 'sales',         label: 'Upselling' },
];

export const BANDS = [
  { id: 'pre_dawn', label: 'Pre-dawn', range: '4–7am' },
  { id: 'morning',  label: 'Morning',  range: '7–11am' },
  { id: 'midday',   label: 'Midday',   range: '11–2pm' },
  { id: 'afternoon',label: 'Afternoon',range: '2–5pm' },
  { id: 'evening',  label: 'Evening',  range: '5–9pm' },
  { id: 'late',     label: 'Late',     range: '9pm–1am' },
];

// NOTE: months_to_interview / overlap / starting are placeholders.
// Replace with values from your career-path catalog at API integration time.
export const CAREER_OPTIONS = [
  {
    path_id: 'it_support_specialist',
    title: 'IT Support Specialist',
    rank: 1,
    rationale_tag: 'fast_interview_path',
    blurb: 'Most service-industry skills transfer here. CompTIA A+ in 12 weeks gets you interview-ready.',
    months_to_interview: '3 mo', overlap: '78%', starting: '$48–62k', schedule_fit: 'Strong',
  },
  {
    path_id: 'junior_data_analyst',
    title: 'Junior Data Analyst',
    rank: 2,
    rationale_tag: 'high_overlap',
    blurb: 'Inventory + cash work translates well. Longer ramp; better ceiling.',
    months_to_interview: '6 mo', overlap: '64%', starting: '$58–72k', schedule_fit: 'Medium',
  },
  {
    path_id: 'qa_analyst',
    title: 'QA Analyst',
    rank: 3,
    rationale_tag: 'schedule_compatible',
    blurb: 'Pattern-finding work that tolerates async hours. Good if your schedule stays chaotic.',
    months_to_interview: '4 mo', overlap: '52%', starting: '$52–68k', schedule_fit: 'Strong',
  },
];

// Broad career domains for the Direction step. Deliberately wide — the target
// user often knows what they DON'T want more than what they do. The onboarding
// agent turns these (+ free-text) into the personalized ranked options on the plan.
export const DOMAINS = [
  { id: 'tech_it',        label: 'Tech & IT' },
  { id: 'data',           label: 'Data & analysis' },
  { id: 'healthcare',     label: 'Healthcare & care' },
  { id: 'trades',         label: 'Skilled trades' },
  { id: 'business_admin', label: 'Business & admin' },
  { id: 'logistics',      label: 'Logistics & operations' },
  { id: 'finance',        label: 'Finance & numbers' },
  { id: 'creative',       label: 'Creative & media' },
  { id: 'education',      label: 'Education & training' },
  { id: 'public_service', label: 'Public service & safety' },
];

export const RATIONALE_LABEL = {
  fast_interview_path:    'Fastest to interview',
  high_overlap:           'Highest skill overlap',
  schedule_compatible:    'Fits chaotic hours',
  entry_level_accessible: 'Entry-level open',
};

export const TRIGGER_SUGGESTIONS_PRIMARY = [
  'After my first coffee on a closing day',
  'After I clock out, before driving home',
  'In my car before my shift starts',
  'Right after my shower post-shift',
  'When I sit down with the second coffee',
];

export const TRIGGER_SUGGESTIONS_FALLBACK = [
  'After the kids are down on a day off',
  'On the bus going to work',
  'Before bed, with the lights low',
  'On my lunch, in the back room',
];

export const RISK_FLAGS = {
  low_schedule_stability: {
    label: 'Schedule swings week to week',
    body:  "We'll route triggers around fixed events — coffee, shower, clock-out — instead of clock times.",
  },
  high_fatigue_pattern: {
    label: 'High fatigue pattern',
    body:  "Late-shift days will cap at LOW-load tasks. We won't ask you to think hard at 3am.",
  },
};

export const STEPS = [
  'welcome', 'schedule', 'energy', 'skills',
  'direction', 'suggestions', 'sprint', 'risk',
  'trigger', 'done',
];

export const INITIAL_STATE = {
  schedule: [],
  energy: [],
  skills: [],
  skill_custom: '',
  domains: [],                // selected broad domain ids (Direction step)
  direction_note: '',         // free text — what pulls at them, incl. what to avoid
  agent_output: null,         // onboarding_agent output (career_options, sprint_rec, risks, ...)
  agent_input: null,          // the input we sent (so the plan can regenerate on thumbs-down)
  interaction_id: null,       // for feedback
  active_track_id: null,      // the track the user picked for their sprint (switchable later)
  daily_min: 20,
  emphasis: 'micro_proof',
  risks_ack: { low_schedule_stability: false, high_fatigue_pattern: false },
  primary_trig: '',
  fallback_trig: '',
};
