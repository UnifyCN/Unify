import { shouldShowEnglishContentNotice } from '@/utils/resourcesLanguage';

describe('shouldShowEnglishContentNotice', () => {
  it.each(['en', 'en-CA', 'EN-us'])('hides the notice for %s', language => {
    expect(shouldShowEnglishContentNotice(language)).toBe(false);
  });

  it.each(['vi', 'es', 'hi', 'fr-CA', 'ar'])(
    'shows the notice for %s',
    language => {
      expect(shouldShowEnglishContentNotice(language)).toBe(true);
    }
  );

  it('stays hidden while the active locale is unavailable', () => {
    expect(shouldShowEnglishContentNotice(undefined)).toBe(false);
  });
});
