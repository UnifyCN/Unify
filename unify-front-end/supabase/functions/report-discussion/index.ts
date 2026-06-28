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

function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
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
    const discussionId = body.discussionId as string | undefined;
    const replyId = body.replyId as string | undefined;
    const reason = String(body.reason ?? '')
      .trim()
      .slice(0, 500);

    const hasDiscussion = isUuid(discussionId);
    const hasReply = isUuid(replyId);

    if (hasDiscussion === hasReply) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Provide exactly one of discussionId or replyId',
        }),
        { status: 200 }
      );
    }

    if (reason.length < 5) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Please provide a short reason (min 5 characters).',
        }),
        { status: 200 }
      );
    }

    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 200 }
      );
    }

    const { data: authData, error: userError } =
      await supabase.auth.getUser(token);
    const user = authData?.user;
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid user' }),
        { status: 200 }
      );
    }

    const targetTable = hasDiscussion
      ? 'module_discussions'
      : 'discussion_replies';
    const targetId = hasDiscussion ? discussionId! : replyId!;

    const { data: targetRow, error: targetError } = await supabase
      .from(targetTable)
      .select('id, author_id, body, status')
      .eq('id', targetId)
      .maybeSingle();

    if (targetError || !targetRow) {
      return new Response(
        JSON.stringify({ success: false, error: 'Content not found' }),
        { status: 200 }
      );
    }

    if (targetRow.author_id === user.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot report your own content' }),
        { status: 200 }
      );
    }

    const reportPayload = hasDiscussion
      ? {
          reporter_id: user.id,
          discussion_id: discussionId,
          reply_id: null,
          reason,
        }
      : {
          reporter_id: user.id,
          discussion_id: null,
          reply_id: replyId,
          reason,
        };

    const { error: reportError } = await supabase
      .from('discussion_reports')
      .insert(reportPayload);

    if (reportError) {
      if (reportError.code === '23505') {
        return new Response(
          JSON.stringify({ success: false, error: 'Already reported' }),
          { status: 200 }
        );
      }
      console.error('Report insert error:', reportError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to submit report' }),
        { status: 200 }
      );
    }

    const { error: statusError } = await supabase
      .from(targetTable)
      .update({ status: 'reported' })
      .eq('id', targetId)
      .neq('status', 'hidden');

    if (statusError) {
      console.error('Status update error:', statusError);
    }

    const { data: reporterProfile } = await supabase
      .from('users')
      .select('username')
      .eq('id', user.id)
      .maybeSingle();

    const reporterUsername = reporterProfile?.username ?? 'Unknown User';
    const contentPreview = escapeHtml(String(targetRow.body).slice(0, 280));
    const contentType = hasDiscussion ? 'Discussion' : 'Reply';

    try {
      await resend.emails.send({
        from: RESEND_FROM,
        to: RESEND_TO,
        subject: `Module ${contentType} Reported`,
        html: `
          <h2>Module ${contentType} Reported</h2>

          <p><strong>Reporter:</strong> ${escapeHtml(reporterUsername)}</p>
          <p><strong>Content type:</strong> ${contentType}</p>
          <p><strong>Content ID:</strong> ${escapeHtml(targetId)}</p>
          <p><strong>Author ID:</strong> ${escapeHtml(String(targetRow.author_id))}</p>
          <p><strong>Reason:</strong> ${escapeHtml(reason)}</p>

          <hr/>

          <p><strong>Content preview:</strong></p>
          <blockquote>${contentPreview}</blockquote>
        `,
      });
    } catch (emailErr) {
      console.error('Failed to send discussion report email:', emailErr);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Report Discussion Function Error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Server error' }),
      { status: 500 }
    );
  }
});
