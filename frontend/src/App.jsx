import React, { useMemo, useState } from 'react';

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
    <div className="max-w-3xl mx-auto p-6 bg-paper-0 min-h-screen text-ink-0 font-sans">
      <h1 className="text-3xl font-serif font-semibold text-accent-deep mb-2">Pocket Professor Pilot Wizard</h1>
      <p className="text-sm text-ink-2 mb-6">API Base: {API_BASE || '(set VITE_API_BASE_URL)'}</p>

      <div className="flex flex-wrap gap-2 mb-8 border-b border-paper-edge pb-4">
        {steps.map((step, idx) => (
          <span 
            key={step.id} 
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              step.id === activeStep 
                ? 'bg-accent text-paper-0' 
                : 'bg-paper-2 text-ink-1'
            }`}
          >
            {idx + 1}. {step.label}
          </span>
        ))}
      </div>

      {activeStep === 'login' && (
        <div className="bg-paper-1 p-6 rounded-lg shadow-sm border border-paper-edge mb-6">
          <h2 className="text-xl font-serif mb-4 text-ink-0">Email Login</h2>
          
          <div className="flex flex-col gap-2 mb-4">
            <label htmlFor="email" className="text-sm font-medium text-ink-1">Email</label>
            <input 
              id="email"
              name="email"
              className="p-2 border border-paper-edge rounded bg-paper-0 text-ink-0 focus:outline-none focus:border-accent"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="you@example.com" 
              type="email"
            />
            <button 
              className="bg-accent text-paper-0 py-2 rounded font-medium hover:bg-accent-deep disabled:opacity-50"
              onClick={requestCode} 
              disabled={loading || !email}
            >
              Send login code
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="code" className="text-sm font-medium text-ink-1">Code</label>
            <input 
              id="code"
              name="code"
              className="p-2 border border-paper-edge rounded bg-paper-0 text-ink-0 focus:outline-none focus:border-accent"
              value={code} 
              onChange={(e) => setCode(e.target.value)} 
              placeholder="6-digit code" 
              type="text"
            />
            <button 
              className="bg-accent text-paper-0 py-2 rounded font-medium hover:bg-accent-deep disabled:opacity-50"
              onClick={verifyCode} 
              disabled={loading || !email || !code}
            >
              Verify + Continue
            </button>
          </div>
        </div>
      )}

      {canAccessFlow && ['onboarding_agent', 'professor_agent', 'career_coach_agent'].includes(activeStep) && (
        <div className="bg-paper-1 p-6 rounded-lg shadow-sm border border-paper-edge mb-6">
          <h2 className="text-xl font-serif mb-2">{steps[currentStepIndex]?.label}</h2>
          <p className="text-sm text-ink-2 mb-4">Edit JSON input if needed, then run this agent.</p>
          
          <label htmlFor={`agent-input-${activeStep}`} className="sr-only">Agent Input JSON</label>
          <textarea 
            id={`agent-input-${activeStep}`}
            name={`agent-input-${activeStep}`}
            className="w-full p-3 font-mono text-sm bg-paper-2 border border-paper-edge rounded text-ink-0 mb-4 focus:outline-none focus:border-accent"
            rows={10} 
            value={inputs[activeStep]} 
            onChange={(e) => setInputs((prev) => ({ ...prev, [activeStep]: e.target.value }))} 
          />
          <button 
            className="w-full bg-accent text-paper-0 py-2 rounded font-medium hover:bg-accent-deep disabled:opacity-50 mb-6"
            onClick={() => runAgent(activeStep)} 
            disabled={loading}
          >
            Run {activeStep}
          </button>

          {outputs[activeStep] && (
            <div className="border-t border-paper-edge pt-4 mt-4">
              <h3 className="text-lg font-serif mb-2">Output</h3>
              <pre className="p-3 bg-paper-2 rounded border border-paper-edge text-xs font-mono overflow-auto mb-4">
                {JSON.stringify(outputs[activeStep], null, 2)}
              </pre>
              
              <div className="flex gap-4 mb-4">
                <div className="flex flex-col w-1/3">
                  <label htmlFor={`feedback-helpful-${activeStep}`} className="text-xs text-ink-2 mb-1">Helpful?</label>
                  <select 
                    id={`feedback-helpful-${activeStep}`}
                    name={`feedback-helpful-${activeStep}`}
                    className="p-2 border border-paper-edge rounded bg-paper-0"
                    value={feedbackHelpful[activeStep] ?? ''} 
                    onChange={(e) => setFeedbackHelpful((prev) => ({ ...prev, [activeStep]: e.target.value === '' ? null : e.target.value === 'true' }))}
                  >
                    <option value="">Select...</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div className="flex flex-col flex-grow">
                  <label htmlFor={`feedback-comment-${activeStep}`} className="text-xs text-ink-2 mb-1">Comments</label>
                  <input 
                    id={`feedback-comment-${activeStep}`}
                    name={`feedback-comment-${activeStep}`}
                    className="p-2 border border-paper-edge rounded bg-paper-0"
                    placeholder="Optional comment" 
                    value={feedbackComment[activeStep] || ''} 
                    onChange={(e) => setFeedbackComment((prev) => ({ ...prev, [activeStep]: e.target.value }))} 
                  />
                </div>
              </div>
              <button 
                className="bg-paper-2 border border-paper-edge text-ink-0 py-2 px-4 rounded font-medium hover:bg-paper-3 disabled:opacity-50"
                onClick={() => submitFeedback(activeStep, outputs[activeStep].interaction_id)} 
                disabled={loading}
              >
                Save feedback
              </button>
            </div>
          )}
        </div>
      )}

      {canAccessFlow && activeStep === 'review' && (
        <div className="bg-paper-1 p-6 rounded-lg shadow-sm border border-paper-edge mb-6">
          <h2 className="text-xl font-serif mb-4 text-ink-0">Review + Global Feedback</h2>
          <p className="text-sm text-ink-2 mb-2">All agent outputs collected in this session:</p>
          <pre className="p-3 bg-paper-2 rounded border border-paper-edge text-xs font-mono overflow-auto mb-4">
            {JSON.stringify(outputs, null, 2)}
          </pre>
          
          <div className="flex gap-4 mb-4">
            <div className="flex flex-col w-1/3">
              <label htmlFor="feedback-helpful-review" className="text-xs text-ink-2 mb-1">Overall helpful?</label>
              <select 
                id="feedback-helpful-review"
                name="feedback-helpful-review"
                className="p-2 border border-paper-edge rounded bg-paper-0"
                value={feedbackHelpful.review ?? ''} 
                onChange={(e) => setFeedbackHelpful((prev) => ({ ...prev, review: e.target.value === '' ? null : e.target.value === 'true' }))}
              >
                <option value="">Select...</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="flex flex-col flex-grow">
              <label htmlFor="feedback-comment-review" className="text-xs text-ink-2 mb-1">Overall feedback</label>
              <input 
                id="feedback-comment-review"
                name="feedback-comment-review"
                className="p-2 border border-paper-edge rounded bg-paper-0"
                placeholder="Overall feedback" 
                value={feedbackComment.review || ''} 
                onChange={(e) => setFeedbackComment((prev) => ({ ...prev, review: e.target.value }))} 
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <button 
              className="w-full bg-accent text-paper-0 py-2 rounded font-medium hover:bg-accent-deep disabled:opacity-50"
              onClick={() => submitFeedback('wizard_overall', null)} 
              disabled={loading}
            >
              Submit overall feedback
            </button>
            <button 
              className="w-full bg-paper-2 border border-paper-edge text-ink-0 py-2 rounded font-medium hover:bg-paper-3"
              onClick={logout}
            >
              Log out
            </button>
          </div>
        </div>
      )}

      {lastMessage && (
        <div className="p-4 bg-paper-2 border border-paper-edge rounded-lg mt-4 text-ink-0">
          <strong className="text-accent">Status:</strong> {lastMessage}
        </div>
      )}
    </div>
  );
}