import { useQuery } from '@tanstack/react-query';
import { getPastTips } from '@/services/tips/getPastTips';
import { useCurrentUser } from '@/context/UserContext';

export const usePastTips = () => {
  const { currentUser } = useCurrentUser();

  return useQuery({
    queryKey: ['pastTips', currentUser?.id],
    queryFn: getPastTips,
    enabled: !!currentUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};
