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

    // Map the database columns to the Event interface with camelCase
    return (
      data?.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        eventDatetime: event.event_datetime,
        eventEndDatetime: event.event_end_datetime,
        location: event.location,
        address: event.address,
        eventType: event.event_type,
        genre: event.genre,
        coverPhotoUrl: event.cover_photo_url,
        maxAttendees: event.max_attendees,
        createdAt: event.created_at,
        updatedAt: event.updated_at,
        userRsvpStatus: event.event_rsvps?.[0]?.rsvp_status || null,
      })) || []
    );
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};
