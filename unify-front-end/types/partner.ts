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

/** A program/event a partner offers, surfaced on the detail screen. */
export interface PartnerProgram {
  /** Program name, e.g. "MentorConnect". */
  name: string;
  /** One-to-two line summary. */
  description: string;
  /** Link opened in an in-app browser. */
  url: string;
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
  /** City/region (+ optional branch count), e.g. "Vancouver · 21 branches". */
  location: string;
  /** Public website; opened in an in-app browser. Button hidden if absent. */
  websiteUrl?: string;
  /** Optional brand logo; falls back to a monogram avatar when absent. */
  logo?: ImageSourcePropType;
  /** Optional hero photo; falls back to a category-tinted gradient when absent. */
  heroImage?: ImageSourcePropType;
  /** Optional programs/events to showcase on the detail screen. */
  programs?: PartnerProgram[];
  /** Lower numbers render first within a category. */
  displayOrder: number;
  /** Inactive partners are filtered out of all UI. */
  active: boolean;
}
