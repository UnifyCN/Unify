import { useQuery } from '@tanstack/react-query';
import { getStageInfo } from '@/services/learn/getStageInfo';

export const useStageInfo = (stageId: string) => {
  return useQuery({
    queryKey: ['stageInfo', stageId],
    queryFn: () => getStageInfo(stageId),
    enabled: !!stageId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
