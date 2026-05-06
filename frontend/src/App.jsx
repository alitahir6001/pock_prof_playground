import React, { useMemo, useState } from 'react';
import OnboardingFlow from './onboarding/OnboardingFlow';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const steps = [
  { id: 'login', label: 'Login' },
  { id: 'onboarding_agent', label: 'Onboarding Agent' },
  { id: 'professor_agent', label: 'Professor Agent' },
  { id: 'career_coach_agent', label: 'Career Coach Agent' },
  { id: 'review', label: 'Review + Feedback' },
];

async function api(path, method, body, token) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json();
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.detail || payload.error_code || 'Request failed');
  }
  return payload;
}

function agentInputTemplate(agentType) {
  const base = {
    session_note: '',
    energy_level: 'medium',
    schedule_constraints: 'shift-work',
  };
  return JSON.stringify({ ...base, agent_type: agentType }, null, 2);
}

export function App() {
  const [activeStep, setActiveStep] = useState('login');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [session, setSession] = useState(() => {
    const raw = localStorage.getItem('pilot_session_token');
    return raw || '';
  });
  const [lastMessage, setLastMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [inputs, setInputs] = useState({
    onboarding_agent: agentInputTemplate('onboarding_agent'),
    professor_agent: agentInputTemplate('professor_agent'),
    career_coach_agent: agentInputTemplate('career_coach_agent'),
  });

  const [outputs, setOutputs] = useState({});
  const [feedbackHelpful, setFeedbackHelpful] = useState({});
  const [feedbackComment, setFeedbackComment] = useState({});

  const currentStepIndex = useMemo(() => steps.findIndex((s) => s.id === activeStep), [activeStep]);

  const canAccessFlow = !!session;

  async function requestCode() {
    setLoading(true);
    try {
      const out = await api('/pilot/auth/email/request', 'POST', { email });
      setLastMessage(out.dev_code ? `Code generated (dev fallback): ${out.dev_code}` : 'Check your email for your login code.');
    } catch (error) {
      setLastMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    setLoading(true);
    try {
      const out = await api('/pilot/auth/email/verify', 'POST', { email, code });
      localStorage.setItem('pilot_session_token', out.session_token);
      setSession(out.session_token);
      setLastMessage(`Logged in as ${out.user.email}`);
      setActiveStep('onboarding_agent');
    } catch (error) {
      setLastMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function runAgent(agentType) {
    setLoading(true);
    try {
      const parsed = JSON.parse(inputs[agentType]);
      const out = await api(`/pilot/agents/${agentType}/run`, 'POST', { input: parsed }, session);
      setOutputs((prev) => ({ ...prev, [agentType]: out }));
      setLastMessage(`${agentType} completed.`);
      const next = steps[currentStepIndex + 1];
      if (next) setActiveStep(next.id);
    } catch (error) {
      setLastMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitFeedback(component, interactionId = null) {
    setLoading(true);
    try {
      await api('/pilot/feedback', 'POST', {
        component,
        interaction_id: interactionId,
        helpful: feedbackHelpful[component] ?? null,
        comment: feedbackComment[component] || '',
      }, session);
      setLastMessage(`Feedback saved for ${component}.`);
    } catch (error) {
      setLastMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('pilot_session_token');
    setSession('');
    setActiveStep('login');
  }

  return (
    <div className="container">
      <h1>Pocket Professor Pilot Wizard</h1>
      <p className="small">API Base: {API_BASE || '(set VITE_API_BASE_URL)'}</p>

      <div className="stepper">
        {steps.map((step, idx) => (
          <span key={step.id} className={`badge ${step.id === activeStep ? 'active' : ''}`}>
            {idx + 1}. {step.label}
          </span>
        ))}
      </div>

      {activeStep === 'login' && (
        <div className="card">
          <h2>Email Login</h2>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <button onClick={requestCode} disabled={loading || !email}>Send login code</button>
          <label>Code</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" />
          <button onClick={verifyCode} disabled={loading || !email || !code}>Verify + Continue</button>
        </div>
      )}

      {canAccessFlow && ['onboarding_agent', 'professor_agent', 'career_coach_agent'].includes(activeStep) && (
        <div className="card">
          <h2>{steps[currentStepIndex]?.label}</h2>
          <p className="small">Edit JSON input if needed, then run this agent.</p>
          <textarea rows={10} value={inputs[activeStep]} onChange={(e) => setInputs((prev) => ({ ...prev, [activeStep]: e.target.value }))} />
          <button onClick={() => runAgent(activeStep)} disabled={loading}>Run {activeStep}</button>

          {outputs[activeStep] && (
            <>
              <h3>Output</h3>
              <pre>{JSON.stringify(outputs[activeStep], null, 2)}</pre>
              <div className="row">
                <select value={feedbackHelpful[activeStep] ?? ''} onChange={(e) => setFeedbackHelpful((prev) => ({ ...prev, [activeStep]: e.target.value === '' ? null : e.target.value === 'true' }))}>
                  <option value="">Was this helpful?</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
                <input placeholder="Optional comment" value={feedbackComment[activeStep] || ''} onChange={(e) => setFeedbackComment((prev) => ({ ...prev, [activeStep]: e.target.value }))} />
              </div>
              <button className="secondary" onClick={() => submitFeedback(activeStep, outputs[activeStep].interaction_id)} disabled={loading}>Save feedback</button>
            </>
          )}
        </div>
      )}

      {canAccessFlow && activeStep === 'review' && (
        <div className="card">
          <h2>Review + Global Feedback</h2>
          <p>All agent outputs collected in this session:</p>
          <pre>{JSON.stringify(outputs, null, 2)}</pre>
          <div className="row">
            <select value={feedbackHelpful.review ?? ''} onChange={(e) => setFeedbackHelpful((prev) => ({ ...prev, review: e.target.value === '' ? null : e.target.value === 'true' }))}>
              <option value="">Overall: was this helpful?</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
            <input placeholder="Overall feedback" value={feedbackComment.review || ''} onChange={(e) => setFeedbackComment((prev) => ({ ...prev, review: e.target.value }))} />
          </div>
          <button onClick={() => submitFeedback('wizard_overall', null)} disabled={loading}>Submit overall feedback</button>
          <button className="secondary" onClick={logout}>Log out</button>
        </div>
      )}

      {lastMessage && <div className="card"><strong>Status:</strong> {lastMessage}</div>}
    </div>
  );
}
