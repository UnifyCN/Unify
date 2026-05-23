/**
 * Giveaway campaign configuration.
 *
 * One active campaign at a time. To run a new campaign, update these constants
 * AND the matching constants in the `giveaway_enforce_window` trigger function
 * (migration `giveaway_entries_server_enforcement`). The trigger has the
 * canonical deadline and campaign id — these constants must stay in lockstep.
 *
 * Enforcement layers (defense in depth):
 *   1. UI:       `GiveawayBanner` self-hides via `isGiveawayActive()`
 *   2. Service:  `submitGiveawayEntry` short-circuits when expired or invalid
 *   3. DB:       `giveaway_enforce_window` BEFORE INSERT trigger rejects late
 *                writes and pins `created_at` to server time so a tampered
 *                client cannot backdate
 *   4. DB:       UNIQUE(user_id, campaign_id) + `terms_accepted = true` CHECK
 */

export const GIVEAWAY = {
  /** Stable identifier for this campaign. Used as part of the UNIQUE constraint
   *  on `giveaway_entries (user_id, campaign_id)`. Never change for a live
   *  campaign — that would let users enter twice. */
  campaignId: 'loblaws-100-may-2026',

  /** May 23, 2026, 12:00:00 AM America/Vancouver (PDT, UTC-7).
   *  Banner stays hidden and the trigger rejects writes before this. */
  startUtc: new Date('2026-05-23T07:00:00Z'),

  /** May 31, 2026, 11:59:59 PM America/Vancouver (PDT, UTC-7).
   *  PDT is in effect because Canada observes DST from March to November. */
  deadlineUtc: new Date('2026-06-01T06:59:59Z'),

  /** Prize copy for display. Keep this in code (not i18n) for safety —
   *  marketing-approved exact wording. i18n strings reference this. */
  prizeLabel: '$100 Loblaws Gift Card',

  /** Maximum length of the short-answer response (matches DB CHECK constraint). */
  shortAnswerMaxLength: 500,

  /** Optional skill-testing question for Canadian contest law (Criminal Code s.206).
   *  Flip `enableSkillQuestion` to `true` if marketing/legal confirms it's required.
   *  When enabled, the entry form adds a final required field on Step 3. */
  enableSkillQuestion: false,
  skillQuestion: '(5 + 3) × 4 − 2',
  /** Stored as text to allow partial-credit normalization (whitespace, leading +). */
  skillAnswer: '30',
} as const;

export function isGiveawayActive(now: Date = new Date()): boolean {
  const t = now.getTime();
  return (
    t >= GIVEAWAY.startUtc.getTime() && t < GIVEAWAY.deadlineUtc.getTime()
  );
}

export function millisecondsUntilDeadline(now: Date = new Date()): number {
  return Math.max(0, GIVEAWAY.deadlineUtc.getTime() - now.getTime());
}
