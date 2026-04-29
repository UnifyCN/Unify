import { APP_STORE_URL } from '@/constants/appStore';

export const INVITE_CLIPBOARD_PREFIX = 'unify-invite:';

// Alphabet matches the server generator: A-Z minus I and O, digits 2-9 (no 0 or 1).
const CODE_RE = /^[A-HJ-NP-Z2-9]{6}$/;
const PREFIXED_RE = /unify-invite:([A-HJ-NP-Z2-9]{6})/;

export function isInviteCode(value: string): boolean {
  return CODE_RE.test(value);
}

export function parseInviteCode(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (CODE_RE.test(trimmed)) return trimmed;
  const m = trimmed.match(PREFIXED_RE);
  return m ? m[1] : null;
}

export function clipboardPayload(code: string): string {
  return `${INVITE_CLIPBOARD_PREFIX}${code}`;
}

interface InviterContext {
  username: string;
  city?: string | null;
}

export function formatInviteMessage(inviter: InviterContext): string {
  const name = inviter.username?.trim() || 'A friend';
  const cityClause = inviter.city ? ` from ${inviter.city}` : '';
  return (
    `${name}${cityClause} has invited you to join them on Unify, ` +
    `Canada's app for newcomers. ` +
    `Download now to simplify your journey: ${APP_STORE_URL}`
  );
}

export function buildShareUrl(): string {
  return APP_STORE_URL;
}
