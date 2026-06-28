import { getModuleDiscussions } from '@/services/discussions/getModuleDiscussions';
import {
  DiscussionSort,
  ModuleDiscussionData,
} from '@/types/learn/moduleDiscussion';
import { useQuery } from '@tanstack/react-query';

export const useGetModuleDiscussions = (
  moduleId?: string,
  options?: {
    submoduleId?: string | null;
    sort?: DiscussionSort;
  }
) => {
  return useQuery<ModuleDiscussionData[]>({
    queryKey: [
      'module-discussions',
      moduleId ?? 'unknown',
      options?.submoduleId ?? 'all',
      options?.sort ?? 'recent',
    ],
    queryFn: () =>
      getModuleDiscussions(moduleId as string, {
        submoduleId: options?.submoduleId,
        sort: options?.sort,
      }),
    enabled: !!moduleId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  });
};
