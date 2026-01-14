export type Event = {
  id: number;
  title: string;
  description: string | null;
  eventDatetime: string;
  eventEndDatetime: string | null;
  location: string;
  address: string | null;
  eventType: EventType;
  genre: EventGenre | null;
  coverPhotoUrl: string | null;
  externalLink: string;
  maxAttendees: number | null;
  createdAt: string;
  updatedAt: string;
};

enum EventType {
  IN_PERSON = 'in-person',
  ONLINE = 'online',
  HYBRID = 'hybrid',
}

// TODO: Add more event genres later maybe
enum EventGenre {
  SOCIALS = 'Socials',
  FINANCE = 'Finance',
  EMPLOYMENT = 'Employment',
  HOUSING = 'Housing',
  DOCUMENTATION = 'Documentation',
  UNCATEGORIZED = 'Uncategorized',
}
