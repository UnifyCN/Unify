export type LearnSectionId = 'learn' | 'tasks' | 'practice';

interface LearnSectionProgress {
  id: LearnSectionId;
  progressPercent: number;
}

interface CompletionFlags {
  justCompletedLearn?: string;
  justCompletedTasks?: string;
  justCompletedPractice?: string;
}

export function hasLoadedContentItem<T extends { _id: string }>(
  items: T[] | undefined,
  currentId: string | undefined
): boolean {
  return Boolean(
    currentId &&
    Array.isArray(items) &&
    items.some(item => item._id === currentId)
  );
}

export function getCompletedSectionId({
  justCompletedLearn,
  justCompletedTasks,
  justCompletedPractice,
}: CompletionFlags): LearnSectionId | null {
  if (justCompletedPractice === '1') return 'practice';
  if (justCompletedTasks === '1') return 'tasks';
  if (justCompletedLearn === '1') return 'learn';
  return null;
}

export function getNextIncompleteSectionId(
  sections: LearnSectionProgress[],
  completedSectionId: LearnSectionId | null
): LearnSectionId | null {
  if (sections.length === 0) return null;

  const completedIndex = completedSectionId
    ? sections.findIndex(section => section.id === completedSectionId)
    : -1;
  const orderedSections =
    completedIndex >= 0
      ? [
          ...sections.slice(completedIndex + 1),
          ...sections.slice(0, completedIndex),
        ]
      : sections;

  return (
    orderedSections.find(section => section.progressPercent < 100)?.id ?? null
  );
}
