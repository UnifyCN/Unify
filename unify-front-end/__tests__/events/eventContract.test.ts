import {
  EventRow,
  mapEventRow,
  normalizeEventGenre,
} from '@/services/events/eventContract';
import { EVENT_GENRES } from '@/types/events';

const row: EventRow = {
  id: 42,
  title: 'English conversation circle',
  description: null,
  event_datetime: '2026-09-10T18:00:00Z',
  event_end_datetime: null,
  location: 'Vancouver Public Library',
  address: null,
  hosted_by: 'VPL',
  event_type: 'in-person',
  genre: 'Language',
  cover_photo_url: null,
  external_link: null,
  max_attendees: null,
  source: 'crawler:vpl',
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-01T00:00:00Z',
};

describe('mobile event contract', () => {
  it('accepts every genre in the shared web contract', () => {
    for (const genre of EVENT_GENRES) {
      expect(normalizeEventGenre(genre)).toBe(genre);
    }
  });

  it('normalizes null and unknown free-text genres to Uncategorized', () => {
    expect(normalizeEventGenre(null)).toBe('Uncategorized');
    expect(normalizeEventGenre('Career')).toBe('Uncategorized');
  });

  it('preserves nullable crawler fields and the source marker', () => {
    expect(mapEventRow(row)).toMatchObject({
      id: 42,
      description: null,
      eventEndDatetime: null,
      address: null,
      genre: 'Language',
      coverPhotoUrl: null,
      externalLink: null,
      maxAttendees: null,
      source: 'crawler:vpl',
    });

    expect(mapEventRow({ ...row, source: null }).source).toBeNull();
  });
});
