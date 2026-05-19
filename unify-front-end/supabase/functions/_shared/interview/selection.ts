// supabase/functions/_shared/interview/selection.ts
import type { ActiveUser } from './posthog.ts';

export type Tier = 'C' | 'B';

export interface Candidate {
  user: ActiveUser;
  tier: Tier;
}

export interface PickOptions {
  max: number;
  excludeUserIds: Set<string>;  // PostHog personId == auth.users.id
  rng?: () => number;           // injectable for tests
}

export function classifyTier(u: ActiveUser): Tier | null {
  if (u.surfaces14d >= 3 || u.companionMsgs14d >= 5) return 'C';
  if (u.surfaces14d >= 2) return 'B';
  return null;
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function pickCandidates(
  users: ActiveUser[],
  opts: PickOptions,
): Candidate[] {
  const rng = opts.rng ?? Math.random;
  const cTier: Candidate[] = [];
  const bTier: Candidate[] = [];

  for (const u of users) {
    if (opts.excludeUserIds.has(u.personId)) continue;
    const tier = classifyTier(u);
    if (tier === 'C') cTier.push({ user: u, tier });
    else if (tier === 'B') bTier.push({ user: u, tier });
  }

  const cShuffled = shuffle(cTier, rng);
  const picks: Candidate[] = cShuffled.slice(0, opts.max);

  if (picks.length < opts.max) {
    const bShuffled = shuffle(bTier, rng);
    picks.push(...bShuffled.slice(0, opts.max - picks.length));
  }

  return picks;
}
