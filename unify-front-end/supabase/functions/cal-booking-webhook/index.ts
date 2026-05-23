// supabase/functions/cal-booking-webhook/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CAL_COM_WEBHOOK_SECRET    = Deno.env.get('CAL_COM_WEBHOOK_SECRET')!;

const encoder = new TextEncoder();

Deno.serve(async (req) => {
  const raw = await req.text();
  const sigHex = req.headers.get('x-cal-signature-256') ?? '';

  // Verify HMAC-SHA256 of raw body against secret
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(CAL_COM_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const expected = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(raw)));
  const expectedHex = Array.from(expected).map(b => b.toString(16).padStart(2, '0')).join('');
  if (!timingSafeEqualHex(expectedHex, sigHex)) {
    console.warn('[cal-webhook] signature mismatch');
    return new Response('bad signature', { status: 403 });
  }

  let payload: any;
  try { payload = JSON.parse(raw); } catch { return new Response('bad json', { status: 400 }); }

  if (payload?.triggerEvent !== 'BOOKING_CREATED') {
    return new Response('ignored', { status: 200 });
  }

  // Cal.com puts attendee email under payload.payload.attendees[0].email (v2 schema)
  const email: string | undefined =
    payload?.payload?.attendees?.[0]?.email
    ?? payload?.payload?.responses?.email?.value
    ?? payload?.payload?.email;
  const bookingId: string | undefined =
    payload?.payload?.uid
    ?? payload?.payload?.id
    ?? String(payload?.payload?.bookingId ?? '');

  if (!email) {
    console.log('[cal-webhook] no attendee email; ignoring');
    return new Response('ok', { status: 200 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: latest } = await supabase
    .from('interview_invites')
    .select('id')
    .eq('email', email)
    .eq('status', 'sent')
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latest?.id) {
    console.log('[cal-webhook] no matching sent invite for', email);
    return new Response('ok', { status: 200 });
  }

  await supabase
    .from('interview_invites')
    .update({
      status:         'booked',
      booked_at:      new Date().toISOString(),
      cal_booking_id: bookingId ?? null,
    })
    .eq('id', latest.id);

  return new Response('ok', { status: 200 });
});

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
