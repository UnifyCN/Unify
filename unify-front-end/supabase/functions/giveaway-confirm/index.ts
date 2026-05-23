import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM = Deno.env.get('RESEND_FROM');

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const CAMPAIGN_DEFAULT = 'loblaws-100-may-2026';
const PRIZE_LABEL = '$100 Loblaws Gift Card';
const WINNER_DATE_LABEL = 'June 1, 2026';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderHtml(opts: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  shortAnswer: string;
}): string {
  const phoneRow = opts.phone
    ? `<tr><td style="padding:4px 0;color:#575757;font-size:14px;">Phone</td><td style="padding:4px 0;color:#000;font-size:14px;text-align:right;"><strong>${escapeHtml(opts.phone)}</strong></td></tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#FAFAFA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FAFAFA;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background:#FFFFFF;border-radius:20px;border:1px solid #E8E8E8;">
          <tr>
            <td style="padding:32px 28px 8px;">
              <div style="font-size:38px;line-height:1;margin-bottom:16px;">🎁</div>
              <h1 style="margin:0 0 10px;font-size:28px;font-weight:700;color:#000000;letter-spacing:-0.4px;line-height:34px;">You're entered, ${escapeHtml(opts.firstName)}!</h1>
              <p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#575757;">Thanks for entering the Unify ${PRIZE_LABEL} giveaway. The winner will be drawn at random on <strong style="color:#000;">${WINNER_DATE_LABEL}</strong>.</p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FFF8E7;border:1px solid #F2DDA3;border-radius:16px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <div style="font-size:11px;font-weight:700;letter-spacing:0.8px;color:#575757;text-transform:uppercase;margin-bottom:10px;">What we have on file</div>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr><td style="padding:4px 0;color:#575757;font-size:14px;">Name</td><td style="padding:4px 0;color:#000;font-size:14px;text-align:right;"><strong>${escapeHtml(opts.firstName)} ${escapeHtml(opts.lastName)}</strong></td></tr>
                      <tr><td style="padding:4px 0;color:#575757;font-size:14px;">Email</td><td style="padding:4px 0;color:#000;font-size:14px;text-align:right;"><strong>${escapeHtml(opts.email)}</strong></td></tr>
                      ${phoneRow}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 28px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F5F5F5;border-radius:16px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <div style="font-size:11px;font-weight:700;letter-spacing:0.8px;color:#575757;text-transform:uppercase;margin-bottom:10px;">Your answer</div>
                    <p style="margin:0;font-size:15px;line-height:22px;color:#000000;font-style:italic;">&ldquo;${escapeHtml(opts.shortAnswer)}&rdquo;</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 28px 28px;">
              <p style="margin:0;font-size:14px;line-height:20px;color:#888888;">If you're the winner, we'll email you at <strong style="color:#575757;">${escapeHtml(opts.email)}</strong> with your digital gift card. No further action needed.</p>
            </td>
          </tr>
        </table>

        <p style="margin:24px auto 0;max-width:560px;font-size:12px;line-height:18px;color:#999999;text-align:center;">
          Didn't enter this giveaway? Reply to this email and we'll remove your entry.<br>
          Unify · Canadian newcomers, together.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderText(opts: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  shortAnswer: string;
}): string {
  const lines = [
    `You're entered, ${opts.firstName}!`,
    '',
    `Thanks for entering the Unify ${PRIZE_LABEL} giveaway.`,
    `The winner will be drawn at random on ${WINNER_DATE_LABEL}.`,
    '',
    'What we have on file:',
    `  Name:  ${opts.firstName} ${opts.lastName}`,
    `  Email: ${opts.email}`,
    opts.phone ? `  Phone: ${opts.phone}` : null,
    '',
    'Your answer:',
    `  "${opts.shortAnswer}"`,
    '',
    `If you're the winner, we'll email you at ${opts.email} with your digital gift card. No further action needed.`,
    '',
    'Didn\'t enter? Reply to this email and we\'ll remove your entry.',
    '— Unify',
  ];
  return lines.filter(l => l !== null).join('\n');
}

Deno.serve(async req => {
  if (!RESEND_API_KEY || !RESEND_FROM) {
    console.error('Missing Resend env vars');
    return new Response(
      JSON.stringify({ success: false, error: 'Missing Resend env vars' }),
      { status: 500 }
    );
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase env vars');
    return new Response(
      JSON.stringify({ success: false, error: 'Missing Supabase env vars' }),
      { status: 500 }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const resend = new Resend(RESEND_API_KEY);

  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const { data: authData, error: userError } =
      await supabase.auth.getUser(token);
    const user = authData?.user;
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid user' }),
        { status: 401 }
      );
    }

    // campaign_id is optional in the request body — defaults to the current
    // active campaign so callers don't have to know it.
    let campaignId = CAMPAIGN_DEFAULT;
    if (req.headers.get('Content-Type')?.includes('application/json')) {
      try {
        const body = await req.json();
        if (typeof body?.campaignId === 'string') {
          campaignId = body.campaignId;
        }
      } catch {
        // Empty/invalid body is fine — use the default
      }
    }

    const { data: entry, error: entryError } = await supabase
      .from('giveaway_entries')
      .select('first_name, last_name, email, phone, short_answer')
      .eq('user_id', user.id)
      .eq('campaign_id', campaignId)
      .maybeSingle();

    if (entryError) {
      console.error('Failed to read entry:', entryError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to read entry' }),
        { status: 200 }
      );
    }
    if (!entry) {
      return new Response(
        JSON.stringify({ success: false, error: 'Entry not found' }),
        { status: 200 }
      );
    }

    try {
      await resend.emails.send({
        from: RESEND_FROM,
        to: entry.email,
        subject: `You're entered to win a ${PRIZE_LABEL} 🎁`,
        html: renderHtml({
          firstName: entry.first_name,
          lastName: entry.last_name,
          email: entry.email,
          phone: entry.phone,
          shortAnswer: entry.short_answer,
        }),
        text: renderText({
          firstName: entry.first_name,
          lastName: entry.last_name,
          email: entry.email,
          phone: entry.phone,
          shortAnswer: entry.short_answer,
        }),
      });
    } catch (emailErr) {
      // Resend failure is non-fatal — the entry itself is the source of truth.
      // Log so we can audit later.
      console.error('Failed to send giveaway confirmation email:', emailErr);
      return new Response(
        JSON.stringify({ success: false, error: 'Email send failed' }),
        { status: 200 }
      );
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Giveaway Confirm Function Error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Server error' }),
      { status: 500 }
    );
  }
});
