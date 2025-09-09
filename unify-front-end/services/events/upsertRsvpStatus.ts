import { supabase } from '@/lib/supabase';
import { UserRsvpStatus } from '@/types/events';

export const upsertRsvpStatus = async (
  eventId: number,
  rsvpStatus: UserRsvpStatus
): Promise<void> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase.from('event_rsvps').upsert(
      {
        user_id: user.id,
        event_id: eventId,
        rsvp_status: rsvpStatus,
        rsvp_date: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,event_id',
      }
    );

    if (error) {
      throw new Error('Failed to update RSVP status');
    }
  } catch (error) {
    console.error('Error upserting RSVP status:', error);
    throw error;
  }
};
