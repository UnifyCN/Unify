import { useQuery } from '@tanstack/react-query';
import { getModule } from '@/services/learn/getModule';

export const useModule = (moduleId: string) => {
  return useQuery({
    queryKey: ['module', moduleId],
    queryFn: () => getModule(moduleId),
    enabled: !!moduleId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

