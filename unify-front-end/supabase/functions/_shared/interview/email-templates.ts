// supabase/functions/_shared/interview/email-templates.ts
import type { Tier } from './selection.ts';

export interface Rendered { subject: string; html: string; text: string }

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function firstName(full: string | null): string {
  if (!full) return 'there';
  const first = full.trim().split(/\s+/)[0];
  return first || 'there';
}

// ---------- Outbound (to candidate) ----------

export interface OutboundOpts {
  recipientName: string | null;
  calComLink: string;
  unsubscribeUrl: string;
  businessAddress: string;
}

export function renderOutboundEmail(o: OutboundOpts): Rendered {
  const name = escapeHtml(firstName(o.recipientName));
  const cal = escapeHtml(o.calComLink);
  const unsub = escapeHtml(o.unsubscribeUrl);
  const addr = escapeHtml(o.businessAddress);

  const subject = "Quick question from Unify's founder";

  const text =
`Hi ${name},

I'm Savar, one of the co-founders of Unify. You've been one of our most active users this month — thank you, genuinely.

Would you be open to a 20-minute call with me? No agenda, no sales pitch — I just want to hear what's working, what's broken, and what you wish we'd build.

If that sounds good, pick any time that works:
${o.calComLink}

If not, no worries at all.

Thanks for being one of our early users,

Savar Gupta
Co-founder, Unify

—
You're receiving this because you've been actively using the Unify app.
${o.businessAddress} · Unsubscribe: ${o.unsubscribeUrl}
`;

  const html =
`<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a;line-height:1.5">
<p>Hi ${name},</p>
<p>I'm Savar, one of the co-founders of Unify. You've been one of our most active users this month — thank you, genuinely.</p>
<p>Would you be open to a 20-minute call with me? No agenda, no sales pitch — I just want to hear what's working, what's broken, and what you wish we'd build.</p>
<p>If that sounds good, pick any time that works:<br>
<a href="${cal}">${cal}</a></p>
<p>If not, no worries at all.</p>
<p>Thanks for being one of our early users,</p>
<p>Savar Gupta<br>Co-founder, Unify</p>
<hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0 12px">
<p style="font-size:11px;color:#888;line-height:1.4">
You're receiving this because you've been actively using the Unify app.<br>
${addr} · <a href="${unsub}" style="color:#888">Unsubscribe</a>
</p>
</body></html>`;

  return { subject, html, text };
}

// ---------- Approval (to Savar) ----------

export interface ApprovalCandidate {
  email: string;
  name: string | null;
  tier: Tier;
  surfaces14d: number;
  events14d: number;
  companionMsgs14d: number;
  userCreatedAt: string;       // pre-formatted display date
  emailSubject: string;
  emailBodyExcerpt: string;    // ~first 200 chars of text body
  approveUrl: string;
  skipUrl: string;
}

export interface ApprovalOpts {
  candidates: ApprovalCandidate[];
  pipelineHealth: { cTier: number; bTier: number; inCooldown: number };
  warning: string | null;
}

export function renderApprovalEmail(o: ApprovalOpts): Rendered {
  const n = o.candidates.length;
  const subject = `[Unify Picker] ${n} candidate${n === 1 ? '' : 's'} ready for this week`;

  const warningBlock = o.warning
    ? `<div style="background:#fff3cd;border:1px solid #ffeaa7;padding:12px;margin-bottom:16px;border-radius:4px">⚠ ${escapeHtml(o.warning)}</div>`
    : '';

  const bodyBlock = n === 0
    ? `<p>No eligible candidates this week.</p>`
    : o.candidates.map((c, i) => candidateCard(c, i + 1)).join('\n');

  const health = o.pipelineHealth;
  const healthLine = `<p style="font-size:12px;color:#666;margin-top:24px">Pipeline health: ${health.cTier} C-tier · ${health.bTier} B-tier · ${health.inCooldown} in cooldown</p>`;

  const html =
`<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px;color:#1a1a1a;line-height:1.5">
<p>Hey Savar,</p>
<p>This week's picker pulled ${n} candidate${n === 1 ? '' : 's'}. Click Approve &amp; Send on each, or Skip to pass. Anything left untouched by next Sunday auto-expires.</p>
${warningBlock}
${bodyBlock}
${healthLine}
<p style="font-size:11px;color:#888;margin-top:32px">— Unify Picker (auto-generated)</p>
</body></html>`;

  const text = `${n} candidate(s) ready. Open the HTML version to approve each — links require HTML.`;
  return { subject, html, text };
}

function candidateCard(c: ApprovalCandidate, idx: number): string {
  const label = c.name ? `${escapeHtml(c.name)} &lt;${escapeHtml(c.email)}&gt;` : escapeHtml(c.email);
  const intensity = c.companionMsgs14d ? ` · ${c.companionMsgs14d} companion msgs` : '';
  return `<div style="border-top:1px solid #e5e5e5;padding:16px 0">
<p style="margin:0 0 4px"><strong>${idx}. ${label}</strong> &nbsp;(Tier ${c.tier})</p>
<p style="margin:0 0 4px;font-size:13px;color:#555">Active on ${c.surfaces14d} surfaces · ${c.events14d} events${intensity}</p>
<p style="margin:0 0 12px;font-size:13px;color:#555">User since: ${escapeHtml(c.userCreatedAt)}</p>
<div style="background:#f7f7f7;border-radius:4px;padding:12px;font-size:13px;white-space:pre-wrap;font-family:ui-monospace,SFMono-Regular,Menlo,monospace">Subject: ${escapeHtml(c.emailSubject)}

${escapeHtml(c.emailBodyExcerpt)}</div>
<p style="margin:16px 0 0">
  <a href="${escapeHtml(c.approveUrl)}" style="background:#0a7;color:#fff;text-decoration:none;padding:10px 18px;border-radius:4px;font-weight:600;margin-right:8px">Approve &amp; Send →</a>
  <a href="${escapeHtml(c.skipUrl)}" style="background:#eee;color:#333;text-decoration:none;padding:10px 18px;border-radius:4px;font-weight:600">Skip →</a>
</p>
</div>`;
}

// ---------- Static HTML response pages ----------

export function renderUnsubscribeConfirmation(): string {
  return `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:480px;margin:64px auto;padding:24px;text-align:center;color:#1a1a1a">
<h1 style="font-size:20px;margin:0 0 12px">You've been unsubscribed</h1>
<p>You won't receive any more research emails from Unify. Thanks for using the app.</p>
</body></html>`;
}

export function renderInfoPage(message: string): string {
  return `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:480px;margin:64px auto;padding:24px;text-align:center;color:#1a1a1a">
<p>${escapeHtml(message)}</p>
</body></html>`;
}
