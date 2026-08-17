import {
  getEventsForDateFilter,
  getPastEventsSorted,
  getPresentEventGenres,
  getSafeEventExternalUrl,
  getUpcomingEventsSorted,
} from '@/helpers/eventHelpers';
import { Event, EventGenre } from '@/types/events';

const makeEvent = (
  id: number,
  eventDatetime: string,
  genre: EventGenre = 'Socials'
): Event => ({
  id,
  title: `Event ${id}`,
  description: null,
  eventDatetime,
  eventEndDatetime: null,
  location: 'Vancouver',
  address: null,
  hostedBy: null,
  eventType: 'in-person',
  genre,
  coverPhotoUrl: null,
  externalLink: null,
  maxAttendees: null,
  source: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
});

const now = new Date('2026-01-15T12:00:00Z');
const events = [
  makeEvent(1, '2026-01-01T12:00:00Z'),
  makeEvent(2, '2026-01-15T12:00:00Z'),
  makeEvent(3, '2026-04-01T12:00:00Z'),
  makeEvent(4, '2026-02-01T12:00:00Z'),
  makeEvent(5, '2026-05-15T12:00:00Z'),
  makeEvent(6, '2026-06-01T12:00:00Z'),
  makeEvent(7, 'not-a-date'),
];

describe('event date behavior', () => {
  it('matches web: upcoming is soonest-first and inside a strict four-month window', () => {
    expect(getUpcomingEventsSorted(events, now).map(event => event.id)).toEqual(
      [4, 3]
    );
  });

  it('retains mobile Past and sorts it newest-first', () => {
    expect(getPastEventsSorted(events, now).map(event => event.id)).toEqual([
      1,
    ]);
  });

  it('retains mobile All while excluding exact-now and far-future rows', () => {
    expect(
      getEventsForDateFilter(events, 'All', now).map(event => event.id)
    ).toEqual([4, 3, 1]);
  });
});

describe('event genre and link helpers', () => {
  it('returns present genres in the stable web display order', () => {
    const mixed = [
      makeEvent(1, '2026-02-01T12:00:00Z', 'Health'),
      makeEvent(2, '2026-02-02T12:00:00Z', 'Language'),
      makeEvent(3, '2026-02-03T12:00:00Z', 'Employment'),
    ];

    expect(getPresentEventGenres(mixed)).toEqual([
      'Employment',
      'Language',
      'Health',
    ]);
  });

  it('only allows http(s) event links', () => {
    expect(getSafeEventExternalUrl(' https://example.com/event ')).toBe(
      'https://example.com/event'
    );
    expect(getSafeEventExternalUrl('http://example.com/event')).toBe(
      'http://example.com/event'
    );
    expect(getSafeEventExternalUrl('javascript:alert(1)')).toBeNull();
    expect(getSafeEventExternalUrl(null)).toBeNull();
  });
});
