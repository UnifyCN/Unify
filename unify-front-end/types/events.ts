export type Event = {
  id: number;
  title: string;
  description: string | null;
  event_datetime: string;
  location: string;
  event_type: EventType;
  cover_photo_url: string | null;
  max_attendees: number | null;
  created_at: string;
  updated_at: string;
}

enum EventType {
  IN_PERSON = 'in-person',
  ONLINE = 'online',
  HYBRID = 'hybrid',
}