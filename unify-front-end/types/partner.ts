import type { ImageSourcePropType } from 'react-native';

export type PartnerCategory =
  | 'banking'
  | 'telecom'
  | 'insurance'
  | 'housing'
  | 'immigration'
  | 'other';

export const PARTNER_CATEGORY_LABELS: Record<PartnerCategory, string> = {
  banking: 'Banking',
  telecom: 'Phone & Internet',
  insurance: 'Insurance',
  housing: 'Housing',
  immigration: 'Immigration',
  other: 'Other',
};

export const PARTNER_CATEGORY_DESCRIPTIONS: Record<PartnerCategory, string> = {
  banking: 'Open a Canadian bank account. Most newcomers do this in week 1.',
  telecom: 'Phone plans and internet for newcomers.',
  insurance: 'Health, auto, and tenant insurance.',
  housing: 'Rentals, temporary housing, and neighbourhood resources.',
  immigration: 'Licensed consultants for PR, work permits, and citizenship.',
  other: 'Other services for newcomers.',
};

export const PARTNER_CATEGORY_ICONS: Record<PartnerCategory, string> = {
  banking: 'bank-outline',
  telecom: 'cellphone',
  insurance: 'shield-outline',
  housing: 'home-outline',
  immigration: 'passport',
  other: 'information-outline',
};

export interface Partner {
  /** Unique slug used in UTM campaign param. e.g. 'unify-bankname' */
  slug: string;
  /** Display name shown to users */
  name: string;
  category: PartnerCategory;
  /** Static asset, imported via require('@/assets/images/partners/foo.png') */
  logo: ImageSourcePropType;
  /** 1-line value prop */
  tagline: string;
  /** Up to 5 short bullet points */
  benefits: string[];
  /** Optional promo code, copyable */
  promoCode?: string;
  /** Bare partner URL — UTM params are appended at click time via buildPartnerUrl */
  partnerUrl: string;
  /** CTA button label, e.g. "Open Account", "Book Consultation" */
  ctaLabel: string;
  /** Lower numbers render first */
  displayOrder: number;
  /** Inactive partners are filtered out of all UI */
  active: boolean;
  /** ISO date the partnership started, for record-keeping */
  partnerSince: string;
}
