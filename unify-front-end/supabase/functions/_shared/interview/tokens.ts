// supabase/functions/_shared/interview/tokens.ts
export type TokenAction = 'approve' | 'skip' | 'unsubscribe';

const encoder = new TextEncoder();

async function hmacSha256(secret: string, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return new Uint8Array(sig);
}

function toUrlSafeBase64(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signToken(
  id: string,
  action: TokenAction,
  secret: string,
): Promise<string> {
  const sig = await hmacSha256(secret, `${id}:${action}`);
  return toUrlSafeBase64(sig);
}

export async function verifyToken(
  id: string,
  action: TokenAction,
  token: string,
  secret: string,
): Promise<boolean> {
  if (!token || !/^[A-Za-z0-9_-]+$/.test(token)) return false;
  const expected = await signToken(id, action, secret);
  return timingSafeEqual(expected, token);
}
