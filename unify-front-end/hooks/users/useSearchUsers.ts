import { useQuery } from '@tanstack/react-query';
import { searchUsers } from '@/services/users/searchUsers';

export const useSearchUsers = (searchQuery: string) => {
  return useQuery({
    queryKey: ['searchUsers', searchQuery],
    queryFn: () => searchUsers(searchQuery),
    enabled: !!searchQuery.trim(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};
