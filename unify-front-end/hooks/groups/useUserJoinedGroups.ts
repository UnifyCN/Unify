import { useQuery } from '@tanstack/react-query';
import { getUserJoinedGroups } from '@/services/groups/getUserJoinedGroups';
import { Group } from '@/types/groups';

export const useUserJoinedGroups = (targetUserId?: string) => {
  return useQuery<Group[], Error>({
    queryKey: ['joined-groups', targetUserId ?? 'self'],
    queryFn: async () => {
      try {
        return await getUserJoinedGroups(targetUserId);
      } catch {
        return [];
      }
    },
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 5,
  });
};
