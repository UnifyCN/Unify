import { useQuery } from '@tanstack/react-query';
import { getPastTips } from '@/services/tips/getPastTips';

export const usePastTips = (persona?: string, stage?: string) => {
  return useQuery({
    queryKey: ['pastTips', persona, stage],
    queryFn: () => getPastTips(persona!, stage!),
    enabled: !!persona && !!stage,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};
