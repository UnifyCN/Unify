/**
 * Giveaway campaign configuration.
 *
 * One active campaign at a time. To run a new campaign, update these constants
 * (or migrate this to a remote-config source if campaigns become recurring).
 *
 * When the deadline passes:
 *   - `GiveawayBanner` self-hides via `isGiveawayActive()`
 *   - Submissions are blocked client-side; the DB still accepts them, so the
 *     final check is enforced in `submitGiveawayEntry` not the schema.
 */

export const GIVEAWAY = {
  /** Stable identifier for this campaign. Used as part of the UNIQUE constraint
   *  on `giveaway_entries (user_id, campaign_id)`. Never change for a live
   *  campaign — that would let users enter twice. */
  campaignId: 'loblaws-100-may-2026',

  /** May 20, 2026, 11:59:59 PM America/Vancouver (PDT, UTC-7).
   *  PDT is in effect because Canada observes DST from March to November. */
  deadlineUtc: new Date('2026-05-21T06:59:59Z'),

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
  return now.getTime() < GIVEAWAY.deadlineUtc.getTime();
}

export function millisecondsUntilDeadline(now: Date = new Date()): number {
  return Math.max(0, GIVEAWAY.deadlineUtc.getTime() - now.getTime());
}
