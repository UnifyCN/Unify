// supabase/functions/unsubscribe-interview/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyToken } from '../_shared/interview/tokens.ts';
import {
  renderUnsubscribeConfirmation,
  renderInfoPage,
} from '../_shared/interview/email-templates.ts';

const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const INTERVIEW_SIGNING_SECRET  = Deno.env.get('INTERVIEW_SIGNING_SECRET')!;

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const userId = url.searchParams.get('u') ?? '';
  const token  = url.searchParams.get('t') ?? '';

  const ok = await verifyToken(userId, 'unsubscribe', token, INTERVIEW_SIGNING_SECRET);
  if (!ok) {
    return html(renderInfoPage('Invalid or tampered unsubscribe link.'), 403);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Flip flag (idempotent — UPDATE on already-true row is fine)
  await supabase
    .from('users')
    .update({
      do_not_contact: true,
      do_not_contact_at: new Date().toISOString(),
      do_not_contact_reason: 'unsubscribed',
    })
    .eq('id', userId);

  // Mark most recent invite for this user (if any) as unsubscribed for history
  const { data: latest } = await supabase
    .from('interview_invites')
    .select('id')
    .eq('user_id', userId)
    .order('picked_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest?.id) {
    await supabase
      .from('interview_invites')
      .update({ status: 'unsubscribed' })
      .eq('id', latest.id)
      .in('status', ['sent', 'approved', 'pending_approval']);
  }

  return html(renderUnsubscribeConfirmation());
});

function html(body: string, status = 200): Response {
  return new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
