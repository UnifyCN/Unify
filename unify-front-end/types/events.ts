export type Event = {
  id: number;
  title: string;
  description: string | null;
  eventDatetime: string;
  eventEndDatetime: string | null;
  location: string;
  address: string | null;
  hostedBy: string | null;
  eventType: EventType;
  genre: EventGenre;
  coverPhotoUrl: string | null;
  externalLink: string | null;
  maxAttendees: number | null;
  /** null marks a manually entered event; crawler rows use `crawler:<org-slug>`. */
  source: string | null;
  createdAt: string;
  updatedAt: string;
};

export const EVENT_TYPES = ['in-person', 'online', 'hybrid'] as const;

export type EventType = (typeof EVENT_TYPES)[number];

/**
 * Shared `events.genre` values in the same display order as the web app.
 * The database column is free text, so readers must normalize unknown values to
 * Uncategorized instead of trusting a cast.
 */
export const EVENT_GENRES = [
  'Employment',
  'Language',
  'Housing',
  'Finance',
  'Documentation',
  'Health',
  'Family',
  'Education',
  'Socials',
  'Uncategorized',
] as const;

export type EventGenre = (typeof EVENT_GENRES)[number];
