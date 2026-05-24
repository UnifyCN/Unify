// supabase/functions/approve-interview-invite/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend';
import { verifyToken, signToken } from '../_shared/interview/tokens.ts';
import { renderOutboundEmail, renderInfoPage } from '../_shared/interview/email-templates.ts';

const SUPABASE_URL                = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const INTERVIEW_SIGNING_SECRET    = Deno.env.get('INTERVIEW_SIGNING_SECRET')!;
const RESEND_USER_EMAILS_API_KEY  = Deno.env.get('RESEND_USER_EMAILS_API_KEY')!;
const RESEND_INTERVIEW_FROM       = Deno.env.get('RESEND_INTERVIEW_FROM') ?? 'Savar from Unify <contact@unifysocial.ca>';
const CAL_COM_LINK                = Deno.env.get('CAL_COM_LINK')!;
const BUSINESS_ADDRESS            = Deno.env.get('BUSINESS_ADDRESS')!;
const FUNCTIONS_BASE_URL          = `${SUPABASE_URL}/functions/v1`;
const DRY_RUN                     = Deno.env.get('INTERVIEW_DRY_RUN') === 'true';

const TOKEN_TTL_DAYS = 14;

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const inviteId = url.searchParams.get('i') ?? '';
  const token    = url.searchParams.get('t') ?? '';

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const resend = new Resend(RESEND_USER_EMAILS_API_KEY);

  const ok = await verifyToken(inviteId, 'approve', token, INTERVIEW_SIGNING_SECRET);
  if (!ok) return html(renderInfoPage('Invalid or tampered approval link.'), 403);

  const { data: invite } = await supabase
    .from('interview_invites')
    .select('*')
    .eq('id', inviteId)
    .maybeSingle();

  if (!invite) return html(renderInfoPage('Invite not found.'), 404);

  // Idempotency
  if (invite.status === 'sent' || invite.status === 'booked') {
    return html(renderInfoPage(`Already sent on ${new Date(invite.sent_at).toLocaleString()}.`));
  }
  if (invite.status === 'skipped') {
    return html(renderInfoPage('This invite was skipped.'));
  }
  if (invite.status === 'expired') {
    return html(renderInfoPage('This approval link has expired. The invite was auto-expired.'));
  }
  if (invite.status !== 'pending_approval' && invite.status !== 'approved') {
    return html(renderInfoPage(`Cannot approve from status "${invite.status}".`));
  }

  // Token age check (defense-in-depth)
  const ageDays = (Date.now() - new Date(invite.picked_at).getTime()) / 86400_000;
  if (ageDays > TOKEN_TTL_DAYS) {
    return html(renderInfoPage('This approval link has expired.'));
  }

  // Re-render outbound (so unsub URL is regenerated freshly)
  const unsubToken = await signToken(invite.user_id, 'unsubscribe', INTERVIEW_SIGNING_SECRET);
  const unsubUrl = `${FUNCTIONS_BASE_URL}/unsubscribe-interview?u=${invite.user_id}&t=${unsubToken}`;
  const outbound = renderOutboundEmail({
    recipientName:   invite.name,
    calComLink:      CAL_COM_LINK,
    unsubscribeUrl:  unsubUrl,
    businessAddress: BUSINESS_ADDRESS,
  });

  if (DRY_RUN) {
    console.log('[interview-approve] DRY_RUN — would send to', invite.email);
    return html(renderInfoPage(`DRY RUN: would have sent to ${invite.email}.`));
  }

  // Flip to approved (only on real send path)
  await supabase
    .from('interview_invites')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', inviteId);

  const sendRes = await resend.emails.send({
    from:    RESEND_INTERVIEW_FROM,
    to:      invite.email,
    subject: outbound.subject,
    html:    outbound.html,
    text:    outbound.text,
    replyTo: 'contact@unifysocial.ca',
  });

  await supabase
    .from('interview_invites')
    .update({
      status:          'sent',
      sent_at:         new Date().toISOString(),
      resend_email_id: sendRes.data?.id ?? null,
    })
    .eq('id', inviteId);

  return html(renderInfoPage(`Sent to ${invite.email}.`));
});

function html(body: string, status = 200): Response {
  return new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
