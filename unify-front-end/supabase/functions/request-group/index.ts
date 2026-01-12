
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM = Deno.env.get('RESEND_FROM'); // e.g. "Unify <noreply@unifysocial.ca>"
const RESEND_TO = Deno.env.get('RESEND_TO');     // "contact@unifysocial.ca"

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

  let body: Payload;
  try {
    body = await req.json();
  } catch {
    return badRequest('Invalid JSON.');
  }

  const { groupName, audience, reason, requesterEmail, extraNotes } = body ?? {};

  if (!groupName?.trim() || !audience?.trim() || !reason?.trim() || !requesterEmail?.trim()) {
    return badRequest('Missing required fields.');
  }

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
      subject: `Group Request: ${groupName}`,
      html,
      reply_to: requesterEmail,
    }),
  });

  const data = await resendRes.json().catch(() => ({}));

  if (!resendRes.ok) {
    return new Response(JSON.stringify({ error: 'Resend error', details: data }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
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
