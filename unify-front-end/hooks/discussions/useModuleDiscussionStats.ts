import { getModuleDiscussionStats } from '@/services/discussions/discussionMetadata';
import { ModuleDiscussionStats } from '@/types/learn/moduleDiscussion';
import { useQuery } from '@tanstack/react-query';

export const useModuleDiscussionStats = (moduleId?: string) => {
  return useQuery<ModuleDiscussionStats>({
    queryKey: ['module-discussion-stats', moduleId ?? 'unknown'],
    queryFn: () => getModuleDiscussionStats(moduleId as string),
    enabled: !!moduleId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};
