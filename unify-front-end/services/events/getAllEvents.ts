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
      .select('*')
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
        externalLink: event.external_link,
        maxAttendees: event.max_attendees,
        createdAt: event.created_at,
        updatedAt: event.updated_at,
      })) || []
    );
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};
