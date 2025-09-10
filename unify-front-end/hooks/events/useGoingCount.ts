import { useQuery } from '@tanstack/react-query';
import { getGoingCount } from '@/services/events/getGoingCount';

export const useGoingCount = (eventId: number) => {
  return useQuery({
    queryKey: ['goingCount', eventId],
    queryFn: () => getGoingCount(eventId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!eventId, // Only run query if eventId exists
  });
};
