import {
  mergeI18nOverlay,
  normalizeSanityLanguage,
} from '@/services/sanity/i18n';

describe('Sanity language overlays', () => {
  it('keeps the English document id while replacing translated content', () => {
    type LessonStub = {
      _id: string;
      title: string;
      description: string;
    };
    expect(
      mergeI18nOverlay<LessonStub>({
        _id: 'lesson-english-id',
        title: 'English title',
        description: 'English fallback',
        i18n: {
          _id: 'lesson-translated-id',
          title: 'Titre français',
          description: null,
        },
      })
    ).toEqual({
      _id: 'lesson-english-id',
      title: 'Titre français',
      description: 'English fallback',
    });
  });

  it.each([
    ['en', 'en'],
    ['vi-VN', 'vi'],
    ['es-MX', 'es'],
    ['hi-IN', 'hi'],
    ['ar-CA', 'ar'],
    ['fr', 'fr-CA'],
    ['fr-CA', 'fr-CA'],
    ['pa-IN', 'en'],
    ['unknown', 'en'],
  ] as const)(
    'normalizes %s to the available Sanity language %s',
    (input, expected) => {
      expect(normalizeSanityLanguage(input)).toBe(expected);
    }
  );
});
