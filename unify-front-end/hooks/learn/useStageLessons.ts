import { useQuery } from '@tanstack/react-query';
import { getStageLessons } from '@/services/learn/getStageLessons';

export const useStageLessons = (stageId: string) => {
  return useQuery({
    queryKey: ['stageLessons', stageId],
    queryFn: () => getStageLessons(stageId),
    enabled: !!stageId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};


