import {
  getEventsWindowEnd,
  getEventsForDateFilter,
  getPastEventsSorted,
  getPresentEventGenres,
  getSafeEventExternalUrl,
  getUpcomingEventsSorted,
  handoffEventExternalUrl,
  openEventExternalUrl,
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

const webWindowEnd = (from: Date): Date => {
  const end = new Date(from);
  end.setMonth(end.getMonth() + 4);
  return end;
};

const now = new Date('2026-01-15T12:00:00Z');
const windowEnd = webWindowEnd(now).getTime();
const events = [
  makeEvent(1, '2026-01-01T12:00:00Z'),
  makeEvent(2, '2026-01-15T12:00:00Z'),
  makeEvent(3, '2026-04-01T12:00:00Z'),
  makeEvent(4, '2026-02-01T12:00:00Z'),
  makeEvent(5, new Date(windowEnd).toISOString()),
  makeEvent(6, '2026-06-01T12:00:00Z'),
  makeEvent(7, 'not-a-date'),
  makeEvent(8, new Date(windowEnd - 1).toISOString()),
  makeEvent(9, new Date(windowEnd + 1).toISOString()),
];

describe('event date behavior', () => {
  it('matches web: upcoming is soonest-first and inside a strict four-month window', () => {
    expect(getUpcomingEventsSorted(events, now).map(event => event.id)).toEqual(
      [4, 3, 8]
    );
  });

  it('uses strict boundaries: exact-now and exact-window-end are not Upcoming', () => {
    const ids = getUpcomingEventsSorted(events, now).map(event => event.id);
    expect(ids).not.toContain(2);
    expect(ids).not.toContain(5);
    expect(ids).not.toContain(9);
  });

  it('retains mobile Past and sorts it newest-first', () => {
    expect(getPastEventsSorted(events, now).map(event => event.id)).toEqual([
      1,
    ]);
  });

  it('makes All truly unbounded and deterministic across every valid date', () => {
    expect(
      getEventsForDateFilter(events, 'All', now).map(event => event.id)
    ).toEqual([2, 4, 3, 8, 5, 9, 6, 1]);
  });

  it('breaks equal-date ties by id rather than input order', () => {
    const tied = [
      makeEvent(11, '2026-02-01T12:00:00Z'),
      makeEvent(10, '2026-02-01T12:00:00Z'),
    ];
    expect(
      getEventsForDateFilter(tied, 'All', now).map(event => event.id)
    ).toEqual([10, 11]);
  });

  it('matches web local-month overflow semantics for Oct 31', () => {
    const from = new Date('2026-10-31T07:30:00.000Z');
    const actual = getEventsWindowEnd(from);

    expect(actual).toEqual(webWindowEnd(from));
  });

  it('matches web when local-calendar arithmetic crosses Pacific DST', () => {
    const from = new Date('2026-11-01T07:30:00.000Z');
    const actual = getEventsWindowEnd(from);

    expect(actual).toEqual(webWindowEnd(from));
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
    expect(getSafeEventExternalUrl('ftp://example.com/event')).toBeNull();
    expect(getSafeEventExternalUrl('https://?event=1')).toBeNull();
    expect(getSafeEventExternalUrl('https:// example.com/event')).toBeNull();
    expect(getSafeEventExternalUrl(null)).toBeNull();
  });

  it('only reports opened after the platform accepts the URL handoff', async () => {
    const openUrl = jest.fn().mockResolvedValue(undefined);

    await expect(
      openEventExternalUrl('https://example.com/event', openUrl)
    ).resolves.toBe('opened');
    expect(openUrl).toHaveBeenCalledWith('https://example.com/event');
  });

  it('distinguishes invalid URLs and platform open failures', async () => {
    const openUrl = jest.fn().mockRejectedValue(new Error('no handler'));

    await expect(
      openEventExternalUrl('javascript:alert(1)', openUrl)
    ).resolves.toBe('invalid');
    expect(openUrl).not.toHaveBeenCalled();

    await expect(
      openEventExternalUrl('https://example.com/event', openUrl)
    ).resolves.toBe('failed');
  });

  it('records analytics only after a successful platform handoff', async () => {
    const onOpened = jest.fn();
    const onFailure = jest.fn();

    await handoffEventExternalUrl({
      value: 'https://example.com/event',
      openUrl: jest.fn().mockResolvedValue(undefined),
      onOpened,
      onFailure,
    });

    expect(onOpened).toHaveBeenCalledTimes(1);
    expect(onFailure).not.toHaveBeenCalled();
  });

  it('requests user feedback instead of analytics when opening fails', async () => {
    const onOpened = jest.fn();
    const onFailure = jest.fn();

    await handoffEventExternalUrl({
      value: 'https://example.com/event',
      openUrl: jest.fn().mockRejectedValue(new Error('no handler')),
      onOpened,
      onFailure,
    });

    expect(onOpened).not.toHaveBeenCalled();
    expect(onFailure).toHaveBeenCalledWith('failed');
  });
});
