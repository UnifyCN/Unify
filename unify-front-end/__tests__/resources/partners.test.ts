import {
  PARTNERS,
  getActivePartners,
  getPartnersByCategory,
  getCategoriesWithPartners,
  getPartnerBySlug,
} from '@/constants/Partners';
import { CATEGORY_ORDER, type PartnerCategory } from '@/types/partner';

describe('partner data', () => {
  it('has 16 partners, all active, with unique slugs', () => {
    expect(PARTNERS).toHaveLength(16);
    expect(PARTNERS.every(p => p.active)).toBe(true);
    expect(new Set(PARTNERS.map(p => p.slug)).size).toBe(16);
  });

  it('every partner has required fields + a valid category', () => {
    for (const p of PARTNERS) {
      expect(p.name).toBeTruthy();
      expect(p.tagline).toBeTruthy();
      expect(p.description.length).toBeGreaterThan(20);
      expect(p.highlights.length).toBeGreaterThanOrEqual(2);
      expect(p.location).toBeTruthy();
      expect(CATEGORY_ORDER).toContain(p.category);
    }
  });

  it('every websiteUrl is a valid http(s) URL', () => {
    for (const p of PARTNERS) {
      if (p.websiteUrl) expect(p.websiteUrl).toMatch(/^https?:\/\/.+/);
    }
  });

  it('getCategoriesWithPartners returns categories in CATEGORY_ORDER with correct counts', () => {
    const cats = getCategoriesWithPartners();
    expect(cats.map(c => c.category)).toEqual([
      'newcomerServices',
      'employment',
      'libraries',
      'community',
      'immigration',
    ]);
    const counts = Object.fromEntries(cats.map(c => [c.category, c.partnerCount]));
    expect(counts).toEqual({
      newcomerServices: 5,
      employment: 3,
      libraries: 3,
      community: 3,
      immigration: 2,
    });
  });

  it('getPartnersByCategory returns only that category, sorted by displayOrder', () => {
    const libs = getPartnersByCategory('libraries' as PartnerCategory);
    expect(libs).toHaveLength(3);
    expect(libs.every(p => p.category === 'libraries')).toBe(true);
    const orders = libs.map(p => p.displayOrder);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it('getPartnerBySlug resolves a known slug and returns undefined otherwise', () => {
    expect(getPartnerBySlug('diversecity')?.name).toBe('DIVERSEcity');
    expect(getPartnerBySlug('does-not-exist')).toBeUndefined();
  });

  it('getActivePartners returns every active partner and excludes inactive ones', () => {
    // All current partners are active.
    expect(getActivePartners()).toHaveLength(16);
    // The filter must actually drop inactive partners, not just sort.
    const withInactive = [
      ...PARTNERS,
      { ...PARTNERS[0], slug: 'test-inactive', active: false, displayOrder: 99 },
    ];
    const active = withInactive
      .filter(p => p.active)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    expect(active.find(p => p.slug === 'test-inactive')).toBeUndefined();
  });

  it('any partner programs are well-formed (name, description, http(s) url)', () => {
    for (const p of PARTNERS) {
      for (const program of p.programs ?? []) {
        expect(program.name).toBeTruthy();
        expect(program.description.length).toBeGreaterThan(10);
        expect(program.url).toMatch(/^https?:\/\/.+/);
      }
    }
  });

  it('IEC-BC showcases its 4 programs', () => {
    const iecbc = getPartnerBySlug('iec-bc');
    expect(iecbc?.programs?.map(pr => pr.name)).toEqual([
      'MentorConnect',
      'TalentConnect',
      'ASCEND',
      'FAST',
    ]);
  });
});
