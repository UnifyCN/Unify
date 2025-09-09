import { useQuery } from '@tanstack/react-query';
import { getSubmoduleLessons } from '@/services/learn/getSubmoduleLessons';

export const useSubmoduleLessons = (submoduleId: string) => {
  return useQuery({
    queryKey: ['submodule-lessons', submoduleId],
    queryFn: () => getSubmoduleLessons(submoduleId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!submoduleId, // Only run query if submoduleId is provided
  });
};
