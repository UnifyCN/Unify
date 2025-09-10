import { useQuery } from '@tanstack/react-query';
import { getAllModules } from '../../services/learn/getAllModules';

export function useAllModules() {
  return useQuery({
    queryKey: ['allModules'],
    queryFn: getAllModules,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
