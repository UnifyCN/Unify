import type { Partner, PartnerCategory } from '@/types/partner';

/**
 * Lowercase and strip combining accents so "Immigration Québec" matches
 * "quebec". The explicit \u0300-\u036f range is used instead of a
 * `\p{Diacritic}` property escape, which is not safe to assume on Hermes.
 *
 * đ is folded separately. It is its own letter rather than d plus a combining
 * mark, so NFD leaves it whole and a Vietnamese speaker typing "Định" would
 * otherwise match nothing.
 */
export function normalizeQuery(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .trim();
}

/** Resolves a category to its display label, so i18n stays out of this module. */
export type CategoryLabelResolver = (category: PartnerCategory) => string;

/**
 * Every field a query is matched against. Kept in one place so the searchable
 * surface is obvious: what a person types is a service ("job search"), an
 * organization ("ISSofBC"), a place ("Surrey"), or a category ("Find Work").
 */
function haystack(partner: Partner, labelFor: CategoryLabelResolver): string {
  return normalizeQuery(
    [
      partner.name,
      partner.tagline,
      partner.serviceArea,
      labelFor(partner.category),
      ...(partner.programs?.map(program => program.name) ?? []),
      ...(partner.highlights ?? []),
    ].join(' ')
  );
}

/**
 * Partners matching a free-text query, in the order they were given.
 *
 * Every whitespace-separated token must appear somewhere in the partner's
 * searchable text, so "surrey job" narrows rather than widens. A blank query
 * returns the list unchanged — the caller decides whether that means "show the
 * category grid instead".
 */
export function selectPartnersMatching(
  partners: Partner[],
  query: string,
  labelFor: CategoryLabelResolver
): Partner[] {
  const tokens = normalizeQuery(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return partners;
  return partners.filter(partner => {
    const text = haystack(partner, labelFor);
    return tokens.every(token => text.includes(token));
  });
}
