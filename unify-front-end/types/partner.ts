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

export const PARTNER_CATEGORY_LABELS: Record<PartnerCategory, string> = {
  newcomerServices: 'Newcomer Services',
  employment: 'Employment & Careers',
  libraries: 'Libraries',
  community: 'Community & Nonprofits',
  immigration: 'Immigration',
};

export const PARTNER_CATEGORY_DESCRIPTIONS: Record<PartnerCategory, string> = {
  newcomerServices:
    'Settlement agencies and programs to help you find your footing.',
  employment: 'Job boards, mentorship, and career support for newcomers.',
  libraries: 'Free programs, spaces, and resources at your local library.',
  community: 'Local nonprofits and community centres open to everyone.',
  immigration: 'Licensed consultants for permits, PR, and citizenship.',
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
  /** Lower numbers render first within a category. */
  displayOrder: number;
  /** Inactive partners are filtered out of all UI. */
  active: boolean;
}
