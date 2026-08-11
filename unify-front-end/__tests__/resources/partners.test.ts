import {
  PARTNERS,
  selectActivePartners,
  getActivePartners,
  getPartnersByCategory,
  getCategoriesWithPartners,
  getPartnerBySlug,
} from '@/constants/Partners';
import { CATEGORY_ORDER, type PartnerCategory } from '@/types/partner';

describe('partner data', () => {
  it('has 20 partners, all active, with unique slugs', () => {
    expect(PARTNERS).toHaveLength(20);
    expect(PARTNERS.every(p => p.active)).toBe(true);
    expect(new Set(PARTNERS.map(p => p.slug)).size).toBe(20);
  });

  // A category with a single org reads as an oversight in a directory shown
  // to partner agencies, so this is a shipping rule, not a nicety.
  //
  // Insurance and Money are deliberate exceptions: each launched with one
  // named commercial partner (TuGo, Desjardins) rather than being held back.
  // They are listed here so a third thin category fails the build instead of
  // slipping in unnoticed.
  const SINGLE_ORG_EXCEPTIONS: PartnerCategory[] = ['insurance', 'money'];

  it('no category ships with fewer than 2 partners, except the known singles', () => {
    const thin = getCategoriesWithPartners()
      .filter(c => c.partnerCount < 2)
      .map(c => c.category);
    expect(thin.sort()).toEqual([...SINGLE_ORG_EXCEPTIONS].sort());
  });

  it('every partner has required fields + a valid category', () => {
    for (const p of PARTNERS) {
      expect(p.name).toBeTruthy();
      expect(p.tagline).toBeTruthy();
      expect(p.description.length).toBeGreaterThan(20);
      expect(p.highlights.length).toBeGreaterThanOrEqual(2);
      expect(p.serviceArea).toBeTruthy();
      expect(CATEGORY_ORDER).toContain(p.category);
    }
  });

  it('every website is a valid http(s) URL', () => {
    for (const p of PARTNERS) {
      if (p.website) expect(p.website).toMatch(/^https?:\/\/.+/);
    }
  });

  it('getCategoriesWithPartners returns categories in CATEGORY_ORDER with correct counts', () => {
    const cats = getCategoriesWithPartners();
    expect(cats.map(c => c.category)).toEqual([
      'gettingSettled',
      'findWork',
      'immigrationHelp',
      'librariesLearning',
      'communityBelonging',
      'networksPlanning',
      'internationalStudents',
      'insurance',
      'money',
    ]);
    const counts = Object.fromEntries(cats.map(c => [c.category, c.partnerCount]));
    expect(counts).toEqual({
      gettingSettled: 3,
      findWork: 2,
      immigrationHelp: 2,
      librariesLearning: 3,
      communityBelonging: 3,
      networksPlanning: 3,
      internationalStudents: 2,
      insurance: 1,
      money: 1,
    });
  });

  it('getPartnersByCategory returns only that category, sorted by displayOrder', () => {
    const libs = getPartnersByCategory('librariesLearning' as PartnerCategory);
    expect(libs).toHaveLength(3);
    expect(libs.every(p => p.category === 'librariesLearning')).toBe(true);
    const orders = libs.map(p => p.displayOrder);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it('getPartnerBySlug resolves a known slug and returns undefined otherwise', () => {
    expect(getPartnerBySlug('diversecity')?.name).toBe('DIVERSEcity');
    expect(getPartnerBySlug('does-not-exist')).toBeUndefined();
  });

  it('getActivePartners returns every active partner, sorted by displayOrder', () => {
    const active = getActivePartners();
    // All 20 current partners are active, so none are dropped today.
    expect(active).toHaveLength(20);
    expect(active.every(p => p.active)).toBe(true);
    const orders = active.map(p => p.displayOrder);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it('selectActivePartners drops inactive partners and sorts the rest', () => {
    // Every shipped partner is active, so feed the real filter a list that
    // isn't — this exercises the helper instead of re-implementing it.
    const inactive = { ...PARTNERS[0], slug: 'test-inactive', active: false };
    const result = selectActivePartners([
      inactive,
      { ...PARTNERS[0], slug: 'b', active: true, displayOrder: 2 },
      { ...PARTNERS[0], slug: 'a', active: true, displayOrder: 1 },
    ]);
    expect(result.map(p => p.slug)).toEqual(['a', 'b']);
  });

  it('any partner programs are well-formed (name, description, http(s) url)', () => {
    for (const p of PARTNERS) {
      for (const program of p.programs ?? []) {
        expect(program.name).toBeTruthy();
        expect(program.description.length).toBeGreaterThan(10);
        // url is optional — not every partner publishes a page per program.
        if (program.url) expect(program.url).toMatch(/^https?:\/\/.+/);
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
