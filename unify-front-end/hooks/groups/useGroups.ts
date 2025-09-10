import { getAllGroups } from '@/services/groups/getAllGroups';
import { useQuery } from '@tanstack/react-query';

export const useGroups = () => {
  return useQuery({
    queryKey: ['groups'],
    queryFn: () => getAllGroups(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};
