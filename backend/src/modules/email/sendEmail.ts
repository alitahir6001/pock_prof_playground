export interface EmailConfig {
  resendApiKey: string;
  fromAddress: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export function emailConfigFromEnv(env: Record<string, string | undefined>): EmailConfig {
  return { resendApiKey: env.RESEND_API_KEY || '', fromAddress: env.RESEND_FROM_EMAIL || '' };
}

export function isEmailConfigured(config: EmailConfig): boolean {
  return config.resendApiKey.length > 0 && config.fromAddress.length > 0;
}

/** Sends one email through Resend (plain text, plus HTML when given). Throws if Resend is not configured or rejects it. */
export async function sendEmail(config: EmailConfig, message: EmailMessage): Promise<void> {
  if (!isEmailConfigured(config)) throw new Error('RESEND_API_KEY and RESEND_FROM_EMAIL are required to send email.');

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${config.resendApiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: config.fromAddress,
      to: [message.to],
      subject: message.subject,
      text: message.text,
      ...(message.html ? { html: message.html } : {}),
    }),
  });

  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error(`Resend rejected the email (${resp.status}): ${detail}`);
  }
}
