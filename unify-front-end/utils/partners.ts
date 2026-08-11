import type { Partner } from '@/types/partner';

/**
 * Where the user came from when they tapped a partner CTA.
 * Used as utm_medium so partner reporting can attribute by surface.
 */
export type PartnerCtaSource =
  | 'learn_resources'
  | 'companion_ai'
  | 'checklist_link'
  | 'home_card';

/**
 * Append Unify's UTM scheme to a partner's bare URL.
 *
 * Single source of truth: the partner record stores the bare URL only,
 * and the tracked URL is derived at click time. This prevents the same
 * UTM scheme from drifting across partner records and lets us A/B
 * different sources (Learn vs. Companion vs. Checklist) without
 * editing partner data.
 */
export function buildPartnerUrl(
  partner: Partner,
  source: PartnerCtaSource
): string {
  if (!partner.website) return '';
  const url = new URL(partner.website);
  url.searchParams.set('utm_source', 'unify');
  url.searchParams.set('utm_medium', source);
  url.searchParams.set('utm_campaign', partner.slug);
  url.searchParams.set('ref', 'unify');
  return url.toString();
}
