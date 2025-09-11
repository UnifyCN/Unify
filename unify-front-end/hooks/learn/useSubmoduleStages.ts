import { useQuery } from '@tanstack/react-query';
import { getSubmoduleStages } from '@/services/learn/getSubmoduleStages';

export const useSubmoduleStages = (submoduleId: string) => {
  return useQuery({
    queryKey: ['submoduleStages', submoduleId],
    queryFn: () => getSubmoduleStages(submoduleId),
    enabled: !!submoduleId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

