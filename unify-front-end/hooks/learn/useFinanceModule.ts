import { useQuery } from '@tanstack/react-query';
import { getFinanceModule } from '@/services/learn/getFinanceModule';

export const useFinanceModule = () => {
  return useQuery({
    queryKey: ['finance-module'],
    queryFn: getFinanceModule,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};
