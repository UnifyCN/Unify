jest.mock('@/sanity-custom', () => ({
  sanityClient: { fetch: jest.fn() },
}));

import { sanityClient } from '@/sanity-custom';
import { getLesson } from '@/services/sanity/lessons';

const mockFetchSanity = sanityClient.fetch as jest.Mock;

describe('getLesson', () => {
  beforeEach(() => mockFetchSanity.mockReset());

  it('passes ids as SDK parameters and preserves the base id after translation', async () => {
    mockFetchSanity.mockResolvedValue({
      _id: 'english-lesson-id',
      _type: 'lesson',
      title: 'English',
      i18n: { _id: 'translated-id', title: 'Español' },
    });
    const untrustedId = 'lesson-id"] | *[_type == "secret"';

    await expect(getLesson(untrustedId, 'es')).resolves.toMatchObject({
      _id: 'english-lesson-id',
      title: 'Español',
    });
    const [query, params] = mockFetchSanity.mock.calls[0];
    expect(query).toContain('_id == $lessonId');
    expect(query).not.toContain(untrustedId);
    expect(params).toEqual({ lessonId: untrustedId, lang: 'es' });
  });
});
