import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM = Deno.env.get('RESEND_FROM'); // e.g. "Unify <noreply@unifysocial.ca>"
const RESEND_TO = Deno.env.get('RESEND_TO'); // "contact@unifysocial.ca"

type Payload = {
  groupName: string;
  audience: string;
  reason: string;
  requesterEmail: string;
  extraNotes?: string;
};

function badRequest(msg: string) {
  return new Response(JSON.stringify({ error: msg }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Basic email validation
function isValidEmail(email: string): boolean {
  // Simple but robust regex for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Sanitize string for use in email subject (prevent header injection)
function sanitizeForSubject(str: string): string {
  return str
    .replace(/[\r\n\t]/g, ' ') // Replace CR, LF, TAB with space
    .replace(/[\x00-\x1f\x7f]/g, '') // Remove other control characters
    .trim()
    .slice(0, 100); // Limit length
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  if (!RESEND_API_KEY || !RESEND_FROM || !RESEND_TO) {
    return new Response(JSON.stringify({ error: 'Missing Resend env vars.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Require authentication to prevent anonymous spam
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return new Response(JSON.stringify({ error: 'Missing Supabase env vars.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: Payload;
  try {
    body = await req.json();
  } catch {
    return badRequest('Invalid JSON.');
  }

  const { groupName, audience, reason, requesterEmail, extraNotes } =
    body ?? {};

  if (
    !groupName?.trim() ||
    !audience?.trim() ||
    !reason?.trim() ||
    !requesterEmail?.trim()
  ) {
    return badRequest('Missing required fields.');
  }

  // Validate email format
  if (!isValidEmail(requesterEmail.trim())) {
    return badRequest('Invalid requesterEmail format.');
  }

  // Sanitize groupName for use in email subject
  const sanitizedGroupName = sanitizeForSubject(groupName);

  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.4">
      <h2>New Group Request</h2>
      <p><strong>Group name:</strong> ${escapeHtml(groupName)}</p>
      <p><strong>Audience:</strong> ${escapeHtml(audience)}</p>
      <p><strong>Reason:</strong><br/>${escapeHtml(reason).replaceAll('\n', '<br/>')}</p>
      <p><strong>Requester email:</strong> ${escapeHtml(requesterEmail)}</p>
      ${
        extraNotes?.trim()
          ? `<p><strong>Extra notes:</strong><br/>${escapeHtml(extraNotes).replaceAll('\n', '<br/>')}</p>`
          : ''
      }
    </div>
  `;

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: RESEND_TO,
      subject: `Group Request: ${sanitizedGroupName}`,
      html,
      reply_to: requesterEmail,
    }),
  });

  const data = await resendRes.json().catch(() => ({}));

  if (!resendRes.ok) {
    return new Response(
      JSON.stringify({ error: 'Resend error', details: data }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(JSON.stringify({ ok: true, data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

function escapeHtml(str: string) {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
