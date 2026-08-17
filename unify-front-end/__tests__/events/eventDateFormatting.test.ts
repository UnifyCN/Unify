import i18n from '@/i18n';
import {
  formatEventDate,
  formatEventTime,
  formatEventTimeRange,
} from '@/helpers/dateHelpers';

describe('event date formatting', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('renders BC event instants in America/Vancouver instead of device time', () => {
    const instant = '2026-07-01T06:30:00Z';

    expect(formatEventDate(instant)).toBe('June 30, 2026');
    expect(formatEventTime(instant)).toBe('11:30 PM');
  });

  it.each(['en', 'es', 'vi'])(
    'lets the %s locale choose its own hour cycle',
    async language => {
      await i18n.changeLanguage(language);
      const instant = '2026-07-01T06:30:00Z';
      const expected = new Date(instant).toLocaleTimeString(language, {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/Vancouver',
      });

      expect(formatEventTime(instant)).toBe(expected);
    }
  );

  it('preserves the locale-provided casing', () => {
    expect(formatEventTime('2026-07-01T06:30:00Z')).toContain('PM');
  });

  it('formats an event range without a seasonally incorrect PST suffix', () => {
    expect(
      formatEventTimeRange('2026-07-01T06:30:00Z', '2026-07-01T07:30:00Z')
    ).toBe('11:30 PM - 12:30 AM');
  });

  it('shows the start time when an event has no end time', () => {
    expect(formatEventTimeRange('2026-07-01T06:30:00Z', null)).toBe('11:30 PM');
  });
});
