import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM = Deno.env.get('RESEND_FROM');
const RESEND_TO = Deno.env.get('RESEND_TO') || 'contact@unifysocial.ca';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

Deno.serve(async req => {
  if (!RESEND_API_KEY || !RESEND_FROM || !RESEND_TO) {
    console.error('Missing Resend env vars');
    return new Response(JSON.stringify({ error: 'Missing Resend env vars' }), {
      status: 500,
    });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase env vars');
    return new Response(
      JSON.stringify({ error: 'Missing Supabase env vars' }),
      { status: 500 }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const resend = new Resend(RESEND_API_KEY);

  try {
    if (!req.headers.get('Content-Type')?.includes('application/json')) {
      return new Response(JSON.stringify({ error: 'Invalid Content-Type' }), {
        status: 400,
      });
    }

    const body = await req.json();
    const { blockedUserId } = body;

    if (!blockedUserId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing blockedUserId' }),
        { status: 200 }
      );
    }

    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token)
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 200 }
      );

    const { data: authData, error: userError } =
      await supabase.auth.getUser(token);
    const user = authData?.user;
    if (userError || !user)
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid user' }),
        { status: 200 }
      );

    // Prevent self-blocking
    if (user.id === blockedUserId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot block yourself' }),
        { status: 200 }
      );
    }

    // Get blocker username
    const { data: blockerProfile } = await supabase
      .from('users')
      .select('username')
      .eq('id', user.id)
      .maybeSingle();

    const blockerUsername = blockerProfile?.username ?? 'Unknown User';

    // Get blocked user username
    const { data: blockedProfile } = await supabase
      .from('users')
      .select('username')
      .eq('id', blockedUserId)
      .maybeSingle();

    const blockedUsername = blockedProfile?.username ?? 'Unknown User';

    // Check for existing block
    const { data: existingBlock } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_id', blockedUserId)
      .maybeSingle();

    if (existingBlock) {
      return new Response(
        JSON.stringify({ success: false, error: 'Already blocked' }),
        { status: 200 }
      );
    }

    // Insert block
    const { error: insertError } = await supabase.from('blocked_users').insert({
      blocker_id: user.id,
      blocked_id: blockedUserId,
    });

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to block user' }),
        { status: 200 }
      );
    }

    // Send notification email
    try {
      await resend.emails.send({
        from: RESEND_FROM,
        to: RESEND_TO,
        subject: 'User Blocked Notification',
        html: `
          <h2>User Blocked</h2>

          <p><strong>Blocker:</strong> ${escapeHtml(blockerUsername)}</p>
          <p><strong>Blocked User:</strong> ${escapeHtml(blockedUsername)}</p>
          <p><strong>Blocked User ID:</strong> ${escapeHtml(String(blockedUserId))}</p>

          <hr/>

          <p>This notification is sent so the team can review the blocked user's content for potential violations.</p>
        `,
      });
    } catch (emailErr) {
      console.error('Failed to send block notification email:', emailErr);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Block User Function Error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Server error' }),
      { status: 500 }
    );
  }
});
