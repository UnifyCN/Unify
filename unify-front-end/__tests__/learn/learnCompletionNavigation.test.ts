import {
  getCompletedSectionId,
  getNextIncompleteSectionId,
  hasLoadedContentItem,
  LearnSectionId,
} from '@/utils/learnCompletionNavigation';

const section = (id: LearnSectionId, progressPercent: number) => ({
  id,
  progressPercent,
});

describe('learnCompletionNavigation', () => {
  describe('hasLoadedContentItem', () => {
    it('rejects unresolved and missing sibling collections', () => {
      expect(hasLoadedContentItem(undefined, 'current')).toBe(false);
      expect(hasLoadedContentItem([{ _id: 'other' }], 'current')).toBe(false);
    });

    it('confirms the current item exists in a loaded collection', () => {
      expect(hasLoadedContentItem([{ _id: 'current' }], 'current')).toBe(true);
    });
  });

  describe('getCompletedSectionId', () => {
    it('returns the completed section from route flags', () => {
      expect(getCompletedSectionId({ justCompletedLearn: '1' })).toBe('learn');
      expect(getCompletedSectionId({ justCompletedTasks: '1' })).toBe('tasks');
      expect(getCompletedSectionId({ justCompletedPractice: '1' })).toBe(
        'practice'
      );
    });

    it('prefers the latest section when old route flags are retained', () => {
      expect(
        getCompletedSectionId({
          justCompletedLearn: '1',
          justCompletedTasks: '1',
          justCompletedPractice: '1',
        })
      ).toBe('practice');
    });
  });

  describe('getNextIncompleteSectionId', () => {
    it('moves forward to the first incomplete section', () => {
      expect(
        getNextIncompleteSectionId(
          [section('learn', 100), section('tasks', 0), section('practice', 0)],
          'learn'
        )
      ).toBe('tasks');
    });

    it('skips completed sections while moving forward', () => {
      expect(
        getNextIncompleteSectionId(
          [
            section('learn', 100),
            section('tasks', 100),
            section('practice', 20),
          ],
          'learn'
        )
      ).toBe('practice');
    });

    it('wraps to earlier unfinished work instead of advancing the submodule', () => {
      expect(
        getNextIncompleteSectionId(
          [
            section('learn', 50),
            section('tasks', 100),
            section('practice', 100),
          ],
          'practice'
        )
      ).toBe('learn');

      expect(
        getNextIncompleteSectionId(
          [
            section('learn', 50),
            section('tasks', 100),
            section('practice', 100),
          ],
          'tasks'
        )
      ).toBe('learn');
    });

    it('ignores stale progress for the section whose save just succeeded', () => {
      expect(
        getNextIncompleteSectionId(
          [section('learn', 80), section('tasks', 0)],
          'learn'
        )
      ).toBe('tasks');
    });

    it('returns null only when no other section is incomplete', () => {
      expect(
        getNextIncompleteSectionId(
          [
            section('learn', 100),
            section('tasks', 100),
            section('practice', 100),
          ],
          'practice'
        )
      ).toBeNull();
    });
  });
});
