import { useQuery } from '@tanstack/react-query';
import { getPastTips } from '@/services/tips/getPastTips';

export const usePastTips = () => {
  return useQuery({
    queryKey: ['pastTips'],
    queryFn: getPastTips,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};
