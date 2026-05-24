// supabase/functions/resend-bounce-webhook/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Webhook } from 'https://esm.sh/svix';

const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_WEBHOOK_SECRET     = Deno.env.get('RESEND_WEBHOOK_SECRET')!;

// Resend uses Svix for webhook signing — verify with their helper.
Deno.serve(async (req) => {
  const raw = await req.text();
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => { headers[k] = v; });

  let payload: any;
  try {
    const wh = new Webhook(RESEND_WEBHOOK_SECRET);
    payload = wh.verify(raw, headers);
  } catch (err) {
    console.warn('[resend-bounce] verify failed:', err);
    return new Response('bad signature', { status: 403 });
  }

  if (payload?.type !== 'email.bounced') {
    return new Response('ignored', { status: 200 });
  }
  // Only hard bounces suppress
  const bounceType: string = payload?.data?.bounce?.type ?? payload?.data?.bounce_type ?? '';
  if (bounceType.toLowerCase() !== 'hard' && bounceType !== 'Permanent') {
    return new Response('soft bounce; ignored', { status: 200 });
  }

  const resendEmailId: string | undefined = payload?.data?.email_id ?? payload?.data?.id;
  if (!resendEmailId) {
    console.log('[resend-bounce] no email_id; ignoring');
    return new Response('ok', { status: 200 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: invite } = await supabase
    .from('interview_invites')
    .select('id, user_id')
    .eq('resend_email_id', resendEmailId)
    .maybeSingle();

  if (!invite) {
    console.log('[resend-bounce] no matching invite for', resendEmailId);
    return new Response('ok', { status: 200 });
  }

  await supabase
    .from('interview_invites')
    .update({ status: 'bounced' })
    .eq('id', invite.id);

  await supabase
    .from('users')
    .update({
      do_not_contact: true,
      do_not_contact_at: new Date().toISOString(),
      do_not_contact_reason: 'hard_bounce',
    })
    .eq('id', invite.user_id);

  return new Response('ok', { status: 200 });
});
