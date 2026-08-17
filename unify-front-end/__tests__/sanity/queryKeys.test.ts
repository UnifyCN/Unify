import { sanityQueryKeys } from '@/hooks/sanity/sanityQueryKeys';
import { checklistTasksQueryKey } from '@/hooks/checklist/checklistQueryKeys';
import { buildChecklistCacheStorageKey } from '@/utils/checklistTaskCache';

describe('language-aware content cache keys', () => {
  it('separates Sanity lesson data by language', () => {
    expect(sanityQueryKeys.lesson('lesson-1', 'en')).not.toEqual(
      sanityQueryKeys.lesson('lesson-1', 'fr-CA')
    );
  });

  it('separates checklist React Query and disk caches by language', () => {
    expect(
      checklistTasksQueryKey('user-1', 2, 'worker', false, 'en')
    ).not.toEqual(checklistTasksQueryKey('user-1', 2, 'worker', false, 'ar'));
    expect(
      buildChecklistCacheStorageKey('user-1', 2, 'worker', false, 'en')
    ).not.toEqual(
      buildChecklistCacheStorageKey('user-1', 2, 'worker', false, 'ar')
    );
  });
});
