// supabase/functions/_shared/interview/selection.test.ts
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
  classifyTier,
  pickCandidates,
  type Candidate,
} from './selection.ts';
import type { ActiveUser } from './posthog.ts';

function u(over: Partial<ActiveUser> = {}): ActiveUser {
  return {
    personId: 'p',
    email: 'x@e.com',
    name: 'X',
    surfaces14d: 2,
    events14d: 5,
    companionMsgs14d: 0,
    ...over,
  };
}

Deno.test('classifyTier returns C for >=3 surfaces', () => {
  assertEquals(classifyTier(u({ surfaces14d: 3, companionMsgs14d: 0 })), 'C');
});

Deno.test('classifyTier returns C for >=5 companion messages', () => {
  assertEquals(classifyTier(u({ surfaces14d: 2, companionMsgs14d: 5 })), 'C');
});

Deno.test('classifyTier returns B for >=2 surfaces but below C', () => {
  assertEquals(classifyTier(u({ surfaces14d: 2, companionMsgs14d: 0 })), 'B');
});

Deno.test('classifyTier returns null for <2 surfaces', () => {
  assertEquals(classifyTier(u({ surfaces14d: 1, companionMsgs14d: 0 })), null);
});

Deno.test('pickCandidates prefers C-tier, fills with B-tier', () => {
  const users: ActiveUser[] = [
    u({ personId: 'b1', email: 'b1@e.com', surfaces14d: 2 }),
    u({ personId: 'b2', email: 'b2@e.com', surfaces14d: 2 }),
    u({ personId: 'c1', email: 'c1@e.com', surfaces14d: 4 }),
    u({ personId: 'b3', email: 'b3@e.com', surfaces14d: 2 }),
    u({ personId: 'c2', email: 'c2@e.com', surfaces14d: 3 }),
  ];
  const rng = makeDeterministicRng(42);
  const picks = pickCandidates(users, { max: 3, excludeUserIds: new Set(), rng });
  const tiers = picks.map(p => p.tier).sort();
  // Both C-tier users must be picked; third slot is a B-tier
  assertEquals(tiers.filter(t => t === 'C').length, 2);
  assertEquals(tiers.filter(t => t === 'B').length, 1);
});

Deno.test('pickCandidates respects excludeUserIds (cooldown set)', () => {
  const users: ActiveUser[] = [
    u({ personId: 'c1', email: 'c1@e.com', surfaces14d: 4 }),
    u({ personId: 'c2', email: 'c2@e.com', surfaces14d: 4 }),
  ];
  const rng = makeDeterministicRng(1);
  const picks = pickCandidates(users, {
    max: 3,
    excludeUserIds: new Set(['c1']),
    rng,
  });
  assertEquals(picks.length, 1);
  assertEquals(picks[0].user.personId, 'c2');
});

Deno.test('pickCandidates returns empty array when nothing eligible', () => {
  const rng = makeDeterministicRng(1);
  const picks = pickCandidates([], { max: 3, excludeUserIds: new Set(), rng });
  assertEquals(picks.length, 0);
});

Deno.test('pickCandidates returns fewer than max when supply is low', () => {
  const users: ActiveUser[] = [
    u({ personId: 'b1', email: 'b1@e.com', surfaces14d: 2 }),
  ];
  const rng = makeDeterministicRng(1);
  const picks = pickCandidates(users, { max: 3, excludeUserIds: new Set(), rng });
  assertEquals(picks.length, 1);
  assertEquals(picks[0].tier, 'B');
});

// Helper: deterministic Mulberry32 PRNG for reproducible tests
function makeDeterministicRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
