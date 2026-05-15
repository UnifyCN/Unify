import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend';
import { en } from './templates/en.ts';

const RESEND_USER_EMAILS_API_KEY = Deno.env.get('RESEND_USER_EMAILS_API_KEY');
const RESEND_WELCOME_FROM = Deno.env.get('RESEND_WELCOME_FROM');
const REPLY_TO = 'contact@unifysocial.ca';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const templates: Record<string, typeof en> = { en };

Deno.serve(async req => {
  if (!RESEND_USER_EMAILS_API_KEY || !RESEND_WELCOME_FROM) {
    console.error('[welcome] missing Resend env vars');
    return new Response(JSON.stringify({ error: 'missing_env' }), {
      status: 500,
    });
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[welcome] missing Supabase env vars');
    return new Response(JSON.stringify({ error: 'missing_env' }), {
      status: 500,
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const resend = new Resend(RESEND_USER_EMAILS_API_KEY);

  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'unauthorized' }),
        { status: 200 },
      );
    }

    const { data: authData, error: authError } =
      await supabase.auth.getUser(token);
    const user = authData?.user;
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'unauthorized' }),
        { status: 200 },
      );
    }

    const { data: userRow } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .maybeSingle();

    if (!userRow?.email) {
      console.error('[welcome] no_email for user', user.id);
      return new Response(
        JSON.stringify({ success: false, error: 'no_email' }),
        { status: 200 },
      );
    }

    const { data: profileRow } = await supabase
      .from('user_onboarding_profiles')
      .select('welcome_email_sent_at, preferred_language')
      .eq('id', user.id)
      .maybeSingle();

    if (profileRow?.welcome_email_sent_at) {
      console.log('[welcome] skipped: already_sent for user', user.id);
      return new Response(
        JSON.stringify({ success: true, skipped: 'already_sent' }),
        { status: 200 },
      );
    }

    const lang = profileRow?.preferred_language ?? 'en';
    const template = templates[lang] ?? templates.en;

    let resendId: string | undefined;
    try {
      const { data: sendData, error: sendError } = await resend.emails.send({
        from: RESEND_WELCOME_FROM,
        to: userRow.email,
        replyTo: REPLY_TO,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
      if (sendError) throw sendError;
      resendId = sendData?.id;
    } catch (emailErr) {
      console.error('[welcome] resend_failed', emailErr);
      return new Response(
        JSON.stringify({ success: false, error: 'resend_failed' }),
        { status: 200 },
      );
    }

    const { error: updateError } = await supabase
      .from('user_onboarding_profiles')
      .update({ welcome_email_sent_at: new Date().toISOString() })
      .eq('id', user.id);

    if (updateError) {
      console.error(
        '[welcome] failed to update welcome_email_sent_at',
        updateError,
      );
      // Email was sent. Don't fail the request.
    }

    console.log('[welcome] sent', { userId: user.id, resendId });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('[welcome] unexpected error', err);
    return new Response(
      JSON.stringify({ success: false, error: 'server_error' }),
      { status: 500 },
    );
  }
});
