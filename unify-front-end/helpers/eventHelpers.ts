import { Event, EVENT_GENRES, EventGenre } from '@/types/events';

/** Keep the discovery window aligned with the web Events surface. */
export const EVENTS_WINDOW_MONTHS = 4;

export type EventDateFilter = 'All' | 'Upcoming' | 'Past';

export const getEventsWindowEnd = (from: Date): Date => {
  const end = new Date(from);
  end.setMonth(end.getMonth() + EVENTS_WINDOW_MONTHS);
  return end;
};

export const getUpcomingEventsSorted = (
  events?: Event[],
  from: Date = new Date()
): Event[] => {
  if (!events?.length) return [];

  const now = from.getTime();
  const windowEnd = getEventsWindowEnd(from).getTime();

  return events
    .filter(event => {
      const startsAt = new Date(event.eventDatetime).getTime();
      return startsAt > now && startsAt < windowEnd;
    })
    .sort(
      (a, b) =>
        new Date(a.eventDatetime).getTime() -
        new Date(b.eventDatetime).getTime()
    );
};

export const getPastEventsSorted = (
  events?: Event[],
  from: Date = new Date()
): Event[] => {
  if (!events?.length) return [];

  const now = from.getTime();
  return events
    .filter(event => new Date(event.eventDatetime).getTime() < now)
    .sort(
      (a, b) =>
        new Date(b.eventDatetime).getTime() -
        new Date(a.eventDatetime).getTime()
    );
};

/**
 * Mobile retains its Past and All tabs. Upcoming uses the same rolling four-month
 * discovery window as web; All combines that bounded list with native's past history.
 */
export const getEventsForDateFilter = (
  events: Event[],
  filter: EventDateFilter,
  from: Date = new Date()
): Event[] => {
  const upcoming = getUpcomingEventsSorted(events, from);
  const past = getPastEventsSorted(events, from);

  switch (filter) {
    case 'Upcoming':
      return upcoming;
    case 'Past':
      return past;
    case 'All':
    default:
      return [...upcoming, ...past];
  }
};

export const getPresentEventGenres = (events: Event[]): EventGenre[] => {
  const genres = new Set(events.map(event => event.genre));
  return EVENT_GENRES.filter(genre => genres.has(genre));
};

export const getSafeEventExternalUrl = (
  value: string | null
): string | null => {
  const url = value?.trim();
  if (!url || (!url.startsWith('https://') && !url.startsWith('http://'))) {
    return null;
  }
  return url;
};
