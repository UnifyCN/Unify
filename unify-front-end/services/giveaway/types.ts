/**
 * Shared types for the giveaway flow.
 */

export interface GiveawayEntryInput {
  shortAnswer: string;
  firstName: string;
  lastName: string;
  email: string;
  /** Optional. If provided, must be a non-empty string. */
  phone?: string;
  /** Optional. Required only when `GIVEAWAY.enableSkillQuestion` is true. */
  skillAnswer?: string;
  /** Whether the user checked the legal consent box on the details step.
   *  Persisted to the DB and audit-checked server-side via a CHECK constraint. */
  termsAccepted: boolean;
}

export interface GiveawayEntry {
  id: string;
  user_id: string;
  campaign_id: string;
  short_answer: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  skill_answer: string | null;
  terms_accepted: boolean;
  created_at: string;
}

export type GiveawaySubmitResult =
  | { success: true; entry: GiveawayEntry }
  | {
      success: false;
      reason:
        | 'unauthorized'
        | 'duplicate'
        | 'expired'
        | 'validation'
        | 'server_error';
      message?: string;
    };
