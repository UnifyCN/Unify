import { useMutation, useQueryClient } from '@tanstack/react-query';
import { upsertRsvpStatus } from '@/services/events/upsertRsvpStatus';
import { UserRsvpStatus } from '@/types/events';

export const useUpsertRsvpStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      rsvpStatus,
    }: {
      eventId: number;
      rsvpStatus: UserRsvpStatus;
    }) => upsertRsvpStatus(eventId, rsvpStatus),
    onSuccess: (_, { eventId }) => {
      // Invalidate going count query to refresh the count
      queryClient.invalidateQueries({
        queryKey: ['goingCount', eventId],
      });

      // Invalidate events query to update user_rsvp_status
      queryClient.invalidateQueries({
        queryKey: ['events'],
      });
    },
  });
};
