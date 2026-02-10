import { supabase } from '@/lib/supabase';
import { Event } from '@/types/events';

export const getEventById = async (eventId: number): Promise<Event | null> => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .maybeSingle();

  if (error) {
    console.error('getEventById error:', error);
    throw new Error('Failed to fetch event');
  }

  if (!data) return null;

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    eventDatetime: data.event_datetime,
    eventEndDatetime: data.event_end_datetime,
    location: data.location,
    address: data.address,
    hostedBy: data.hosted_by,
    eventType: data.event_type,
    genre: data.genre,
    coverPhotoUrl: data.cover_photo_url,
    externalLink: data.external_link,
    maxAttendees: data.max_attendees,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};
