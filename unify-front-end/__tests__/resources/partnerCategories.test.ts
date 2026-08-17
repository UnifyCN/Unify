import {
  CATEGORY_ORDER,
  PARTNER_CATEGORY_LABEL_KEYS,
  PARTNER_CATEGORY_DESCRIPTION_KEYS,
  PARTNER_CATEGORY_ICONS,
  PARTNER_CATEGORY_COLORS,
  PARTNER_CATEGORY_TINTS,
  type PartnerCategory,
} from '@/types/partner';
import en from '@/i18n/locales/en/translation.json';

/** Walks a dotted i18n key against the EN baseline; undefined when absent. */
function resolveKey(key: string): unknown {
  return key
    .split('.')
    .reduce<any>((node, part) => (node == null ? undefined : node[part]), en);
}

function relativeLuminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map(value => parseInt(value, 16) / 255)
    .map(value =>
      value <= 0.04045
        ? value / 12.92
        : Math.pow((value + 0.055) / 1.055, 2.4)
    );
  return (
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  );
}

describe('partner category metadata', () => {
  const maps: Record<string, Record<PartnerCategory, string>> = {
    labelKeys: PARTNER_CATEGORY_LABEL_KEYS,
    descriptionKeys: PARTNER_CATEGORY_DESCRIPTION_KEYS,
    icons: PARTNER_CATEGORY_ICONS,
    colors: PARTNER_CATEGORY_COLORS,
    tints: PARTNER_CATEGORY_TINTS,
  };

  it('CATEGORY_ORDER has all 9 categories, no duplicates', () => {
    expect(CATEGORY_ORDER).toHaveLength(9);
    expect(new Set(CATEGORY_ORDER).size).toBe(9);
  });

  it.each(Object.entries(maps))('every category has a %s entry', (_n, map) => {
    for (const cat of CATEGORY_ORDER) expect(map[cat]).toBeTruthy();
  });

  it('every category label + description key resolves in the en locale', () => {
    for (const cat of CATEGORY_ORDER) {
      expect(typeof resolveKey(PARTNER_CATEGORY_LABEL_KEYS[cat])).toBe(
        'string'
      );
      expect(typeof resolveKey(PARTNER_CATEGORY_DESCRIPTION_KEYS[cat])).toBe(
        'string'
      );
    }
  });

  it('color + tint values are 6-digit hex', () => {
    for (const cat of CATEGORY_ORDER) {
      expect(PARTNER_CATEGORY_COLORS[cat]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(PARTNER_CATEGORY_TINTS[cat]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('category accents meet WCAG AA contrast with white tile text', () => {
    for (const category of CATEGORY_ORDER) {
      const contrast = 1.05 / (relativeLuminance(PARTNER_CATEGORY_COLORS[category]) + 0.05);
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    }
  });
});
