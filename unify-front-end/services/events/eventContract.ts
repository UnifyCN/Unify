import { EVENT_GENRES, Event, EventGenre, EventType } from '@/types/events';

export interface EventRow {
  id: number;
  title: string;
  description: string | null;
  event_datetime: string;
  event_end_datetime: string | null;
  location: string;
  address: string | null;
  hosted_by: string | null;
  event_type: EventType;
  genre: string | null;
  cover_photo_url: string | null;
  external_link: string | null;
  max_attendees: number | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export const EVENT_COLUMNS = [
  'id',
  'title',
  'description',
  'event_datetime',
  'event_end_datetime',
  'location',
  'address',
  'hosted_by',
  'event_type',
  'genre',
  'cover_photo_url',
  'external_link',
  'max_attendees',
  'source',
  'created_at',
  'updated_at',
].join(', ');

export const normalizeEventGenre = (value: string | null): EventGenre =>
  EVENT_GENRES.includes(value as EventGenre)
    ? (value as EventGenre)
    : 'Uncategorized';

export const mapEventRow = (event: EventRow): Event => ({
  id: event.id,
  title: event.title,
  description: event.description,
  eventDatetime: event.event_datetime,
  eventEndDatetime: event.event_end_datetime,
  location: event.location,
  address: event.address,
  hostedBy: event.hosted_by,
  eventType: event.event_type,
  genre: normalizeEventGenre(event.genre),
  coverPhotoUrl: event.cover_photo_url,
  externalLink: event.external_link,
  maxAttendees: event.max_attendees,
  source: event.source,
  createdAt: event.created_at,
  updatedAt: event.updated_at,
});
