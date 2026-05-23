const LOGO_URL =
  'https://wrbauxutkysljmsqojts.supabase.co/storage/v1/object/public/email-assets/unify-email-logo.png';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const en = (opts: { firstName: string | null }) => {
  const safeFirstName = opts.firstName ? escapeHtml(opts.firstName) : null;
  const opener = safeFirstName ? `Hey ${safeFirstName},` : 'Hey there,';
  const textOpener = opts.firstName ? `Hey ${opts.firstName},` : 'Hey there,';

  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;line-height:1.6;color:#1a1a1a;max-width:560px;margin:0 auto;padding:32px 24px;"><img src="${LOGO_URL}" alt="Unify" width="64" height="64" style="display:block;border:0;margin-bottom:24px;"><p style="margin:0 0 16px;">${opener}</p><p style="margin:0 0 16px;">Thanks for joining Unify.</p><p style="margin:0 0 16px;">If you have any questions or feedback, send an email to <a href="mailto:contact@unifysocial.ca" style="color:#1a1a1a;text-decoration:underline;">contact@unifysocial.ca</a> — we'd love to hear from you.</p><p style="margin:32px 0 0;">— Savar &amp; Cedric<br/>Co-Founders, Unify</p><p style="margin:24px 0 0;color:#666;">P.S. We read every single email.</p></div>`;

  const text = `${textOpener}

Thanks for joining Unify.

If you have any questions or feedback, send an email to contact@unifysocial.ca — we'd love to hear from you.

— Savar & Cedric
Co-Founders, Unify

P.S. We read every single email.`;

  return {
    subject: 'Welcome to Unify',
    html,
    text,
  };
};
