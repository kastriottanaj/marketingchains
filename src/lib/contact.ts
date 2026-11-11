import { company } from '../config/company';

/** Options in the "Service Interested In" dropdown. */
export const services = ['Visifluent SaaS', 'SEO & Web Services', 'Courses & Training', 'General Inquiry'] as const;

/**
 * The consent wording shown next to the checkbox, as plain text. It is stored
 * with every submission as proof of what the sender agreed to. The markup in
 * ContactSection.astro must say exactly the same thing (with two links).
 */
export const consentText = `I agree to receive communications and service updates from ${company.legalName} via email or SMS at the contact details provided. Message and data rates may apply. Reply STOP to opt out. View our Terms & Conditions and Privacy Policy.`;

export interface ContactValues {
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  consent: boolean;
}

export type ContactErrors = Partial<Record<'name' | 'email' | 'phone' | 'service' | 'message', string>>;

export type ContactState = {
  /** idle: fresh page. sent: message delivered. invalid: fix the fields. unavailable: mail not configured. failed: mail provider error. */
  status: 'idle' | 'sent' | 'invalid' | 'unavailable' | 'failed';
  values: ContactValues;
  errors: ContactErrors;
};

export const emptyValues: ContactValues = { name: '', email: '', phone: '', service: '', message: '', consent: false };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;
const PHONE_CHARS = /^[0-9+()\-.\s]+$/;

function read(data: FormData, key: string): string {
  const value = data.get(key);
  return typeof value === 'string' ? value.replace(/\r\n/g, '\n').trim() : '';
}

/** Validates a submitted form. `spam` is true when the hidden honeypot field was filled in. */
export function validateContact(data: FormData): { values: ContactValues; errors: ContactErrors; spam: boolean } {
  const values: ContactValues = {
    name: read(data, 'name'),
    email: read(data, 'email'),
    phone: read(data, 'phone'),
    service: read(data, 'service'),
    message: read(data, 'message'),
    consent: data.get('consent') === 'yes',
  };
  const errors: ContactErrors = {};

  if (!values.name || values.name.length > 120 || CONTROL_CHARS.test(values.name)) {
    errors.name = 'Enter your full name.';
  }
  if (!EMAIL.test(values.email) || values.email.length > 254 || CONTROL_CHARS.test(values.email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (values.phone) {
    const digits = values.phone.replace(/\D/g, '');
    if (!PHONE_CHARS.test(values.phone) || values.phone.length > 30 || digits.length < 7 || digits.length > 15) {
      errors.phone = 'Enter a valid phone number, or leave this field empty.';
    }
  }
  if (!(services as readonly string[]).includes(values.service)) {
    errors.service = 'Choose a service.';
  }
  if (values.message.length < 10) {
    errors.message = 'Enter a message of at least 10 characters.';
  } else if (values.message.length > 2000) {
    errors.message = 'Keep your message to 2,000 characters or fewer.';
  }

  return { values, errors, spam: read(data, 'hp_url') !== '' };
}

export interface SubmissionMeta {
  ip: string;
  userAgent: string;
  pageUrl: string;
  submittedAt: Date;
}

export type SendResult = { ok: true } | { ok: false; reason: 'unconfigured' | 'failed' };

/**
 * Emails a submission to the company mailbox through Resend. The email doubles
 * as the consent record: it carries the timestamp, wording, IP address and browser.
 *
 * Configuration (environment variables, read at request time):
 *   RESEND_API_KEY  API key with sending access
 *   CONTACT_FROM    verified sender, e.g. "Marketing Chains LLC <contact@your-domain>"
 *   CONTACT_TO      optional recipient; defaults to the contact email in company.ts
 *   RESEND_API_URL  optional override of https://api.resend.com (used by tests)
 */
export async function sendContactEmail(values: ContactValues, meta: SubmissionMeta): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM;
  const to = process.env.CONTACT_TO || company.contactEmail;
  if (!apiKey || !from || !to) return { ok: false, reason: 'unconfigured' };

  const when = meta.submittedAt.toISOString();
  const text = [
    'New contact form submission',
    '',
    `Name: ${values.name}`,
    `Email: ${values.email}`,
    `Phone: ${values.phone || '(not provided)'}`,
    `Service: ${values.service}`,
    '',
    'Message:',
    values.message,
    '',
    '--- Consent record ---',
    `Consent to communications by email or SMS: ${values.consent ? `YES (box ticked, ${when} UTC)` : 'NO (box not ticked)'}`,
    `Wording shown: "${consentText}"`,
    `Submitted: ${when} UTC`,
    `IP address: ${meta.ip}`,
    `Browser: ${meta.userAgent.slice(0, 300)}`,
    `Page: ${meta.pageUrl}`,
  ].join('\n');

  const subject = `Contact form: ${values.service} (${values.name})`.replace(/[\r\n]+/g, ' ').slice(0, 150);

  try {
    const response = await fetch(`${process.env.RESEND_API_URL || 'https://api.resend.com'}/emails`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify({ from, to: [to], reply_to: values.email, subject, text }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.error('contact form: email provider answered', response.status);
      return { ok: false, reason: 'failed' };
    }
    return { ok: true };
  } catch (error) {
    console.error('contact form: email request failed', error instanceof Error ? error.name : 'unknown error');
    return { ok: false, reason: 'failed' };
  }
}
