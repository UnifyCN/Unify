import { supabase } from '@/lib/supabase';
import { Event } from '@/types/events';

export const getAllEvents = async (): Promise<Event[]> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('events')
      .select(
        `
        *,
        event_rsvps!left(rsvp_status)
      `
      )
      .eq('event_rsvps.user_id', user.id)
      .order('event_datetime', { ascending: true });

    if (error) {
      throw new Error('Failed to fetch events');
    }

    // Transform the data to include user_rsvp_status
    return (
      data?.map(event => ({
        ...event,
        user_rsvp_status: event.event_rsvps?.[0]?.rsvp_status || null,
      })) || []
    );
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};
