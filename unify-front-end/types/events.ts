export type Event = {
  id: number;
  title: string;
  description: string | null;
  eventDatetime: string;
  eventEndDatetime: string | null;
  location: string;
  address: string | null;
  eventType: EventType;
  genre: EventGenre;
  coverPhotoUrl: string | null;
  maxAttendees: number | null;
  createdAt: string;
  updatedAt: string;
  userRsvpStatus: UserRsvpStatus | null;
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
