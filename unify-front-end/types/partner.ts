import type { ImageSourcePropType } from 'react-native';

export type PartnerCategory =
  | 'newcomerServices'
  | 'employment'
  | 'libraries'
  | 'community'
  | 'immigration';

export type PartnershipType = 'resource' | 'referral';

/** Fixed display order for the category grid. */
export const CATEGORY_ORDER: PartnerCategory[] = [
  'newcomerServices',
  'employment',
  'libraries',
  'community',
  'immigration',
];

/** i18n keys — resolve with `t()` at render time, never render these directly. */
export const PARTNER_CATEGORY_LABEL_KEYS: Record<PartnerCategory, string> = {
  newcomerServices: 'learn.resources.category.newcomerServices.label',
  employment: 'learn.resources.category.employment.label',
  libraries: 'learn.resources.category.libraries.label',
  community: 'learn.resources.category.community.label',
  immigration: 'learn.resources.category.immigration.label',
};

/** i18n keys — resolve with `t()` at render time, never render these directly. */
export const PARTNER_CATEGORY_DESCRIPTION_KEYS: Record<PartnerCategory, string> = {
  newcomerServices: 'learn.resources.category.newcomerServices.description',
  employment: 'learn.resources.category.employment.description',
  libraries: 'learn.resources.category.libraries.description',
  community: 'learn.resources.category.community.description',
  immigration: 'learn.resources.category.immigration.description',
};

/** MaterialCommunityIcons names. */
export const PARTNER_CATEGORY_ICONS: Record<PartnerCategory, string> = {
  newcomerServices: 'account-group',
  employment: 'briefcase-outline',
  libraries: 'book-open-variant',
  community: 'hand-heart-outline',
  immigration: 'passport',
};

/** Accent color per category (tiles, monograms, pills, highlight checks). */
export const PARTNER_CATEGORY_COLORS: Record<PartnerCategory, string> = {
  newcomerServices: '#2DB39A',
  employment: '#3B82C4',
  libraries: '#7C6CD6',
  community: '#F68B26',
  immigration: '#E5685A',
};

/** Soft tint per category (pill backgrounds, gradient fallback). */
export const PARTNER_CATEGORY_TINTS: Record<PartnerCategory, string> = {
  newcomerServices: '#EAF7F0',
  employment: '#EAF1FA',
  libraries: '#EFEDFB',
  community: '#FDF1E4',
  immigration: '#FCEDEB',
};

/** What a service costs the person using it. */
export type Cost = 'free' | 'paid' | 'mixed';

/**
 * A program a partner runs — a first-class record, not free text, so the
 * directory can later be re-cut by program instead of by org.
 *
 * Every field beyond `name` is optional: partner sites vary in what they
 * publish, and an unknown value must stay absent rather than be guessed.
 */
export interface PartnerProgram {
  /** Program name, e.g. "MentorConnect". */
  name: string;
  /** One-to-two line summary. */
  description: string;
  /** Who the program is for. Omitted unless the partner states it. */
  eligibility?: string;
  cost?: Cost;
  /** Link opened in an in-app browser. */
  url?: string;
  /**
   * ISO date (YYYY-MM-DD). Set ONLY when a human confirmed this record by
   * phone or email — never from web research. Not surfaced in the UI yet.
   */
  lastVerified?: string;
}

export interface Partner {
  /** Stable kebab-case id (also used in routes + analytics). */
  slug: string;
  name: string;
  category: PartnerCategory;
  /** 'resource' = informational; 'referral' = future commercial relationship. */
  partnershipType: PartnershipType;
  /** One-line value prop shown in the list row. */
  tagline: string;
  /** Long-form "About" copy for the detail screen. */
  description: string;
  /** 2–4 "how they help newcomers" bullets. */
  highlights: string[];
  /** Area served, e.g. "Greater Vancouver", "Surrey", "British Columbia". */
  serviceArea: string;

  // --- "How to get help" — every field optional; render only when populated.
  // An absent value means "the partner does not publish this", NOT "free" or
  // "open to everyone". Never infer these.

  cost?: Cost;
  /**
   * Who qualifies. Many BC settlement services are IRCC-funded and limited to
   * permanent residents and protected persons, which excludes international
   * students and most temporary workers. Routing someone to a service they
   * are ineligible for is this feature's main failure mode, so this is set
   * only from an explicit statement by the partner.
   */
  eligibility?: string;
  /** How to make first contact: walk in, call, email, online form, referral. */
  howToStart?: string;
  phone?: string;
  email?: string;
  address?: string;
  hours?: string;
  /** Languages of service. Omitted when unstated; never assumed to be English. */
  languages?: string[];
  /** Public website; opened in an in-app browser. Button hidden if absent. */
  website?: string;
  /** Optional brand logo; falls back to a monogram avatar when absent. */
  logo?: ImageSourcePropType;
  /** Optional hero photo; falls back to a category-tinted gradient when absent. */
  heroImage?: ImageSourcePropType;
  /** Programs this partner runs, shown on the detail screen. */
  programs?: PartnerProgram[];
  /**
   * ISO date (YYYY-MM-DD). Set ONLY when a human confirmed this record by
   * phone or email — never from web research. Not surfaced in the UI yet;
   * the "Last verified" badge is deliberately deferred.
   */
  lastVerified?: string;
  /** Lower numbers render first within a category. */
  displayOrder: number;
  /** Inactive partners are filtered out of all UI. */
  active: boolean;
}
