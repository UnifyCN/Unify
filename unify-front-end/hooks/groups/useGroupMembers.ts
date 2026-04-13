import { useQuery } from '@tanstack/react-query';
import { getGroupMembers } from '@/services/groups/getGroupMembers';

export const useGroupMembers = (groupId?: number) => {
  return useQuery({
    queryKey: ['group-members', groupId],
    queryFn: () => getGroupMembers(groupId!),
    enabled: !!groupId,
  });
};
