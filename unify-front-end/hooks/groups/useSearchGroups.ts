import { useQuery } from '@tanstack/react-query';
import { searchGroups } from '@/services/groups/searchGroups';

export const useSearchGroups = (searchQuery: string) => {
  return useQuery({
    queryKey: ['searchGroups', searchQuery],
    queryFn: () => searchGroups(searchQuery),
    enabled: !!searchQuery.trim(), // Only run if there's a search query
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};
