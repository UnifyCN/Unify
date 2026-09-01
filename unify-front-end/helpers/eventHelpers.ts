import { Event, EVENT_GENRES, EventGenre } from '@/types/events';

/** Keep the discovery window aligned with the web Events surface. */
export const EVENTS_WINDOW_MONTHS = 4;

export type EventDateFilter = 'All' | 'Upcoming' | 'Past';

export const getEventsWindowEnd = (from: Date): Date => {
  const end = new Date(from);
  // Keep this semantically equivalent to web's local-calendar Date#setMonth
  // behavior, including end-of-month overflow and DST offset changes.
  end.setMonth(end.getMonth() + EVENTS_WINDOW_MONTHS);
  return end;
};

const compareEventStartsAscending = (a: Event, b: Event): number => {
  const dateDifference =
    new Date(a.eventDatetime).getTime() - new Date(b.eventDatetime).getTime();
  return dateDifference || a.id - b.id;
};

const compareEventStartsDescending = (a: Event, b: Event): number => {
  const dateDifference =
    new Date(b.eventDatetime).getTime() - new Date(a.eventDatetime).getTime();
  return dateDifference || a.id - b.id;
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
    .sort(compareEventStartsAscending);
};

export const getPastEventsSorted = (
  events?: Event[],
  from: Date = new Date()
): Event[] => {
  if (!events?.length) return [];

  const now = from.getTime();
  return events
    .filter(event => new Date(event.eventDatetime).getTime() < now)
    .sort(compareEventStartsDescending);
};

export const getCurrentAndFutureEventsSorted = (
  events?: Event[],
  from: Date = new Date()
): Event[] => {
  if (!events?.length) return [];

  const now = from.getTime();
  return events
    .filter(event => {
      const startsAt = new Date(event.eventDatetime).getTime();
      return Number.isFinite(startsAt) && startsAt >= now;
    })
    .sort(compareEventStartsAscending);
};

/**
 * Mobile retains its Past and All tabs. Upcoming uses the same rolling four-month
 * discovery window as web. All is genuinely unbounded: current/future rows appear
 * soonest-first, followed by past rows newest-first; invalid dates are omitted.
 */
export const getEventsForDateFilter = (
  events: Event[],
  filter: EventDateFilter,
  from: Date = new Date()
): Event[] => {
  const past = getPastEventsSorted(events, from);

  switch (filter) {
    case 'Upcoming':
      return getUpcomingEventsSorted(events, from);
    case 'Past':
      return past;
    case 'All':
    default:
      return [...getCurrentAndFutureEventsSorted(events, from), ...past];
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
  if (!url || !/^https?:\/\//i.test(url)) {
    return null;
  }

  try {
    const parsed = new URL(url);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
      parsed.hostname.length > 0
      ? url
      : null;
  } catch {
    return null;
  }
};

export type EventLinkOpenResult = 'opened' | 'invalid' | 'failed';

export const openEventExternalUrl = async (
  value: string | null,
  openUrl: (url: string) => Promise<unknown>
): Promise<EventLinkOpenResult> => {
  const safeUrl = getSafeEventExternalUrl(value);
  if (!safeUrl) return 'invalid';

  try {
    await openUrl(safeUrl);
    return 'opened';
  } catch {
    return 'failed';
  }
};

interface EventLinkHandoffOptions {
  value: string | null;
  openUrl: (url: string) => Promise<unknown>;
  onOpened?: () => void;
  onFailure: (result: Exclude<EventLinkOpenResult, 'opened'>) => void;
}

export const handoffEventExternalUrl = async ({
  value,
  openUrl,
  onOpened,
  onFailure,
}: EventLinkHandoffOptions): Promise<EventLinkOpenResult> => {
  const result = await openEventExternalUrl(value, openUrl);
  if (result === 'opened') {
    onOpened?.();
  } else {
    onFailure(result);
  }
  return result;
};
