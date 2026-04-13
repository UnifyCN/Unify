import { useQuery } from '@tanstack/react-query';
import { getAvailableGroups } from '@/services/groups/getAvailableGroups';
import { getPersonalizedGroups } from '@/services/groups/getPersonalizedGroups';
import type { Group } from '@/types/groups';

export const useGroups = () => {
  return useQuery<Group[], Error>({
    queryKey: ['personalize', 'groups'],
    queryFn: async () => {
      try {
        return await getPersonalizedGroups();
      } catch (err) {
        console.warn(
          'Personalize failed — falling back to available groups',
          err
        );
        return getAvailableGroups();
      }
    },
    staleTime: 1000 * 60 * 15,
    //keepPreviousData: true,
    refetchOnWindowFocus: false,
  });
};
