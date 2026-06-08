import {
  CATEGORY_ORDER,
  PARTNER_CATEGORY_LABELS,
  PARTNER_CATEGORY_DESCRIPTIONS,
  PARTNER_CATEGORY_ICONS,
  PARTNER_CATEGORY_COLORS,
  PARTNER_CATEGORY_TINTS,
  type PartnerCategory,
} from '@/types/partner';

describe('partner category metadata', () => {
  const maps: Record<string, Record<PartnerCategory, string>> = {
    labels: PARTNER_CATEGORY_LABELS,
    descriptions: PARTNER_CATEGORY_DESCRIPTIONS,
    icons: PARTNER_CATEGORY_ICONS,
    colors: PARTNER_CATEGORY_COLORS,
    tints: PARTNER_CATEGORY_TINTS,
  };

  it('CATEGORY_ORDER has all 5 categories, no duplicates', () => {
    expect(CATEGORY_ORDER).toHaveLength(5);
    expect(new Set(CATEGORY_ORDER).size).toBe(5);
  });

  it.each(Object.entries(maps))('every category has a %s entry', (_n, map) => {
    for (const cat of CATEGORY_ORDER) expect(map[cat]).toBeTruthy();
  });

  it('color + tint values are 6-digit hex', () => {
    for (const cat of CATEGORY_ORDER) {
      expect(PARTNER_CATEGORY_COLORS[cat]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(PARTNER_CATEGORY_TINTS[cat]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
