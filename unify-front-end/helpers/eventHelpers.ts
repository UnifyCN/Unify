import { Event } from '@/types/events';

export const getUpcomingEventsSorted = (events?: Event[]): Event[] => {
  if (!events?.length) return [];

  const now = Date.now();

  return events
    .filter(event => new Date(event.eventDatetime).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.eventDatetime).getTime() -
        new Date(b.eventDatetime).getTime()
    );
};
