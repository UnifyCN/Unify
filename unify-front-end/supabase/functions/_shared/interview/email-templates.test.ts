// supabase/functions/_shared/interview/email-templates.test.ts
import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
  renderOutboundEmail,
  renderApprovalEmail,
  renderUnsubscribeConfirmation,
  renderInfoPage,
} from './email-templates.ts';

Deno.test('renderOutboundEmail uses first name when present', () => {
  const out = renderOutboundEmail({
    recipientName: 'Mei Lin',
    calComLink: 'https://cal.com/savar/20min',
    unsubscribeUrl: 'https://example.com/unsub?token=abc',
    businessAddress: '123 Main St, Vancouver BC',
  });
  assertStringIncludes(out.html, 'Hi Mei,');
  assertStringIncludes(out.text, 'Hi Mei,');
  assertEquals(out.subject, "Quick question from Unify's founder");
});

Deno.test('renderOutboundEmail falls back to "there" when name is missing', () => {
  const out = renderOutboundEmail({
    recipientName: null,
    calComLink: 'https://cal.com/savar/20min',
    unsubscribeUrl: 'https://example.com/unsub?token=abc',
    businessAddress: '123 Main St',
  });
  assertStringIncludes(out.html, 'Hi there,');
});

Deno.test('renderOutboundEmail includes CASL footer (address + unsub)', () => {
  const out = renderOutboundEmail({
    recipientName: 'Alex',
    calComLink: 'https://cal.com/savar/20min',
    unsubscribeUrl: 'https://example.com/unsub?token=abc',
    businessAddress: '123 Main St, Vancouver BC',
  });
  assertStringIncludes(out.html, '123 Main St, Vancouver BC');
  assertStringIncludes(out.html, 'https://example.com/unsub?token=abc');
});

Deno.test('renderOutboundEmail HTML-escapes the recipient name', () => {
  const out = renderOutboundEmail({
    recipientName: '<script>alert(1)</script>',
    calComLink: 'https://cal.com/savar/20min',
    unsubscribeUrl: 'https://example.com/unsub',
    businessAddress: '123 Main St',
  });
  assertEquals(out.html.includes('<script>'), false);
  assertStringIncludes(out.html, '&lt;script&gt;');
});

Deno.test('renderApprovalEmail lists each candidate with their per-link buttons', () => {
  const out = renderApprovalEmail({
    candidates: [
      {
        email: 'a@e.com', name: 'Alice', tier: 'C',
        surfaces14d: 4, events14d: 25, companionMsgs14d: 8,
        userCreatedAt: '2026-01-21',
        emailSubject: 'Quick question from Unify\'s founder',
        emailBodyExcerpt: 'Hi Alice,\n\nI\'m Savar...',
        approveUrl: 'https://x/approve?token=1',
        skipUrl: 'https://x/skip?token=1',
      },
    ],
    pipelineHealth: { cTier: 5, bTier: 14, inCooldown: 12 },
    warning: null,
  });
  assertStringIncludes(out.subject, '1 candidate');
  assertStringIncludes(out.html, 'a@e.com');
  assertStringIncludes(out.html, 'Tier C');
  assertStringIncludes(out.html, 'https://x/approve?token=1');
  assertStringIncludes(out.html, 'https://x/skip?token=1');
  assertStringIncludes(out.html, '5 C-tier');
});

Deno.test('renderApprovalEmail handles zero candidates', () => {
  const out = renderApprovalEmail({
    candidates: [],
    pipelineHealth: { cTier: 0, bTier: 0, inCooldown: 0 },
    warning: null,
  });
  assertStringIncludes(out.subject, '0 candidate');
  assertStringIncludes(out.html, 'No eligible candidates');
});

Deno.test('renderApprovalEmail surfaces missed-run warning when present', () => {
  const out = renderApprovalEmail({
    candidates: [],
    pipelineHealth: { cTier: 0, bTier: 0, inCooldown: 0 },
    warning: 'Last successful pick was 11 days ago — previous run may have failed silently',
  });
  assertStringIncludes(out.html, '11 days ago');
});

Deno.test('renderUnsubscribeConfirmation returns valid HTML', () => {
  const html = renderUnsubscribeConfirmation();
  assertStringIncludes(html, '<html');
  assertStringIncludes(html, 'unsubscribed');
});

Deno.test('renderInfoPage shows the provided message', () => {
  const html = renderInfoPage('Approval link expired.');
  assertStringIncludes(html, 'Approval link expired.');
  assertStringIncludes(html, '<html');
});
