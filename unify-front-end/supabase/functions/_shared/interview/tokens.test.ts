// supabase/functions/_shared/interview/tokens.test.ts
import { assertEquals, assertRejects } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { signToken, verifyToken, type TokenAction } from './tokens.ts';

const SECRET = 'test-secret-do-not-use-in-prod';

Deno.test('signToken produces a deterministic, url-safe string', async () => {
  const t1 = await signToken('abc-123', 'approve', SECRET);
  const t2 = await signToken('abc-123', 'approve', SECRET);
  assertEquals(t1, t2);
  // url-safe base64: no +, /, =, or whitespace
  assertEquals(/^[A-Za-z0-9_-]+$/.test(t1), true);
});

Deno.test('signToken differs by action', async () => {
  const a = await signToken('abc-123', 'approve', SECRET);
  const s = await signToken('abc-123', 'skip', SECRET);
  assertEquals(a === s, false);
});

Deno.test('verifyToken returns true for matching token', async () => {
  const t = await signToken('abc-123', 'approve', SECRET);
  const ok = await verifyToken('abc-123', 'approve', t, SECRET);
  assertEquals(ok, true);
});

Deno.test('verifyToken returns false for tampered id', async () => {
  const t = await signToken('abc-123', 'approve', SECRET);
  const ok = await verifyToken('abc-124', 'approve', t, SECRET);
  assertEquals(ok, false);
});

Deno.test('verifyToken returns false for tampered action', async () => {
  const t = await signToken('abc-123', 'approve', SECRET);
  const ok = await verifyToken('abc-123', 'skip', t, SECRET);
  assertEquals(ok, false);
});

Deno.test('verifyToken returns false for wrong secret', async () => {
  const t = await signToken('abc-123', 'approve', SECRET);
  const ok = await verifyToken('abc-123', 'approve', t, 'different-secret');
  assertEquals(ok, false);
});

Deno.test('verifyToken returns false for garbage input', async () => {
  const ok = await verifyToken('abc-123', 'approve', 'not-a-real-token', SECRET);
  assertEquals(ok, false);
});

Deno.test('TokenAction type accepts the three valid actions', () => {
  const actions: TokenAction[] = ['approve', 'skip', 'unsubscribe'];
  assertEquals(actions.length, 3);
});
