// supabase/functions/skip-interview-invite/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyToken } from '../_shared/interview/tokens.ts';
import { renderInfoPage } from '../_shared/interview/email-templates.ts';

const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const INTERVIEW_SIGNING_SECRET  = Deno.env.get('INTERVIEW_SIGNING_SECRET')!;

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const inviteId = url.searchParams.get('i') ?? '';
  const token    = url.searchParams.get('t') ?? '';

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const ok = await verifyToken(inviteId, 'skip', token, INTERVIEW_SIGNING_SECRET);
  if (!ok) return html(renderInfoPage('Invalid or tampered link.'), 403);

  const { data: invite } = await supabase
    .from('interview_invites')
    .select('id, status, email')
    .eq('id', inviteId)
    .maybeSingle();

  if (!invite) return html(renderInfoPage('Invite not found.'), 404);

  if (invite.status === 'skipped') {
    return html(renderInfoPage(`Already skipped.`));
  }
  if (invite.status === 'sent' || invite.status === 'booked') {
    return html(renderInfoPage("This invite was already sent and can't be skipped."), 409);
  }
  if (invite.status === 'expired') {
    return html(renderInfoPage('This invite was already auto-expired.'));
  }
  if (invite.status !== 'pending_approval') {
    return html(renderInfoPage(`Cannot skip from status "${invite.status}".`));
  }

  await supabase
    .from('interview_invites')
    .update({ status: 'skipped' })
    .eq('id', inviteId);

  return html(renderInfoPage(`Skipped: ${invite.email} will not be contacted this week.`));
});

function html(body: string, status = 200): Response {
  return new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
