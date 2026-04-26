import type { Partner, PartnerCategory } from '@/types/partner';

/**
 * Partner directory. Hardcoded for V1.
 *
 * To add a partner: append to the array, set active: true, add a logo asset
 * to assets/images/partners/, run EAS Update.
 *
 * To pause a partner: set active: false. Inactive partners are filtered out
 * of all UI by getActivePartners.
 *
 * Migration note: when partner count reaches ~5 OR content edits ship more
 * than weekly, migrate to Sanity. The Partner shape maps 1:1 to a Sanity
 * doc type, so the swap is mechanical.
 */
export const PARTNERS: Partner[] = [
  {
    slug: 'unify-banking-partner',
    name: '[Bank Partner]',
    category: 'banking',
    logo: require('@/assets/images/placeholderImg.png'),
    tagline:
      'Newcomer-friendly banking with no monthly fee for your first year.',
    benefits: [
      'No SIN required to open',
      'Free Interac e-Transfers',
      'Newcomer credit card eligible',
    ],
    promoCode: 'UNIFY-BANK',
    partnerUrl: 'https://example.com/newcomer',
    ctaLabel: 'Open Account',
    displayOrder: 0,
    active: true,
    partnerSince: '2026-04-01',
  },
  {
    slug: 'unify-immigration-partner',
    name: '[Immigration Consultant]',
    category: 'immigration',
    logo: require('@/assets/images/placeholderImg.png'),
    tagline:
      'Licensed Canadian Immigration Consultants helping with PR, work permits, and citizenship.',
    benefits: [
      'CICC-registered consultants',
      'Free initial consultation',
      'Multilingual support',
    ],
    promoCode: 'UNIFY-IMM',
    partnerUrl: 'https://example.com/consultation',
    ctaLabel: 'Book Consultation',
    displayOrder: 0,
    active: true,
    partnerSince: '2026-04-01',
  },
];

/** Active partners only, sorted by displayOrder. */
export const getActivePartners = (): Partner[] =>
  PARTNERS.filter(p => p.active).sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

/** Active partners in a given category, sorted by displayOrder. */
export const getPartnersByCategory = (category: PartnerCategory): Partner[] =>
  getActivePartners().filter(p => p.category === category);

/**
 * Categories that have at least one active partner, with partner counts.
 * Used to render the category list — empty categories are not shown.
 */
export const getCategoriesWithPartners = (): {
  category: PartnerCategory;
  partnerCount: number;
}[] => {
  const counts = new Map<PartnerCategory, number>();
  for (const partner of getActivePartners()) {
    counts.set(partner.category, (counts.get(partner.category) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([category, partnerCount]) => ({
    category,
    partnerCount,
  }));
};
