export type Event = {
  id: number;
  title: string;
  description: string | null;
  event_datetime: string;
  event_end_datetime: string | null;
  location: string;
  address: string | null;
  event_type: EventType;
  genre: EventGenre;
  cover_photo_url: string | null;
  max_attendees: number | null;
  created_at: string;
  updated_at: string;
  user_rsvp_status: UserRsvpStatus | null;
};

enum EventType {
  IN_PERSON = 'in-person',
  ONLINE = 'online',
  HYBRID = 'hybrid',
}

export enum EventGenre {
  SOCIALS = 'Socials',
  FINANCE = 'Finance',
  EMPLOYMENT = 'Employment',
  HOUSING = 'Housing',
  DOCUMENTATION = 'Documentation',
  UNCATEGORIZED = 'Uncategorized',
}

export enum UserRsvpStatus {
  INTERESTED = 'interested',
  GOING = 'going',
  NOT_INTERESTED = 'not_interested',
}
