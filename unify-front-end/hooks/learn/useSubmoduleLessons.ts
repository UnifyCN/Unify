import { useQuery } from '@tanstack/react-query';
import { getSubmoduleLessons } from '@/services/learn/getSubmoduleLessons';

export const useSubmoduleLessons = (submoduleId: string) => {
  return useQuery({
    queryKey: ['submoduleLessons', submoduleId],
    queryFn: () => getSubmoduleLessons(submoduleId),
    enabled: !!submoduleId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
