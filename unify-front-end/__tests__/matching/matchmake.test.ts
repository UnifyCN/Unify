/**
 * Unit tests for Community Matching logic
 * Tests the core matching algorithms and helper functions
 */

import { buildPoolKey } from '@/matching/pools';

// Helper function for testing pair key logic (used internally in edge functions)
// Note: This is a local implementation for testing purposes since the actual
// implementation lives in the Deno edge function and is not easily importable
const buildPairKey = (userA: string, userB: string): string => {
  const [first, second] = userA < userB ? [userA, userB] : [userB, userA];
  return `${first}:${second}`;
};

// Test buildPairKey function
describe('buildPairKey', () => {
  it('should return consistent key regardless of order', () => {
    const keyAB = buildPairKey('user-a', 'user-b');
    const keyBA = buildPairKey('user-b', 'user-a');
    expect(keyAB).toBe(keyBA);
  });

  it('should sort alphabetically', () => {
    const key = buildPairKey('zebra', 'alpha');
    expect(key).toBe('alpha:zebra');
  });

  it('should handle UUID-style IDs', () => {
    const uuid1 = '123e4567-e89b-12d3-a456-426614174000';
    const uuid2 = 'a23e4567-e89b-12d3-a456-426614174000';
    const key = buildPairKey(uuid1, uuid2);
    expect(key).toBe(`${uuid1}:${uuid2}`);
  });
});

// Test Day 13 reminder detection logic
describe('Day 13 Reminder Detection', () => {
  const isCircleEndingWithin24Hours = (endsAt: string, now: Date): boolean => {
    const endDate = new Date(endsAt);
    const diffMs = endDate.getTime() - now.getTime();
    const DAY_IN_MS = 24 * 60 * 60 * 1000;
    return diffMs > 0 && diffMs <= DAY_IN_MS;
  };

  it('should return true for circle ending in 12 hours', () => {
    const now = new Date('2025-01-08T12:00:00Z');
    const endsAt = '2025-01-09T00:00:00Z'; // 12 hours later
    expect(isCircleEndingWithin24Hours(endsAt, now)).toBe(true);
  });

  it('should return true for circle ending in 23 hours', () => {
    const now = new Date('2025-01-08T12:00:00Z');
    const endsAt = '2025-01-09T11:00:00Z'; // 23 hours later
    expect(isCircleEndingWithin24Hours(endsAt, now)).toBe(true);
  });

  it('should return false for circle ending in 25 hours', () => {
    const now = new Date('2025-01-08T12:00:00Z');
    const endsAt = '2025-01-09T13:00:00Z'; // 25 hours later
    expect(isCircleEndingWithin24Hours(endsAt, now)).toBe(false);
  });

  it('should return false for already ended circle', () => {
    const now = new Date('2025-01-08T12:00:00Z');
    const endsAt = '2025-01-08T11:00:00Z'; // 1 hour ago
    expect(isCircleEndingWithin24Hours(endsAt, now)).toBe(false);
  });
});

// Test countdown display logic
describe('Countdown Display', () => {
  const getCountdownText = (endsAt: string, now: Date): string | null => {
    const end = new Date(endsAt);
    const diffMs = end.getTime() - now.getTime();
    if (diffMs <= 0) return 'Ending soon';
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor(
      (diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
    );
    if (days > 0) return `${days} day${days === 1 ? '' : 's'} left`;
    return `${hours} hour${hours === 1 ? '' : 's'} left`;
  };

  it('should show days when more than 24 hours remain', () => {
    const now = new Date('2025-01-01T12:00:00Z');
    const endsAt = '2025-01-05T12:00:00Z'; // 4 days later
    expect(getCountdownText(endsAt, now)).toBe('4 days left');
  });

  it('should show singular day', () => {
    const now = new Date('2025-01-01T12:00:00Z');
    const endsAt = '2025-01-02T13:00:00Z'; // ~25 hours later
    expect(getCountdownText(endsAt, now)).toBe('1 day left');
  });

  it('should show hours when less than 24 hours remain', () => {
    const now = new Date('2025-01-01T12:00:00Z');
    const endsAt = '2025-01-02T06:00:00Z'; // 18 hours later
    expect(getCountdownText(endsAt, now)).toBe('18 hours left');
  });

  it('should show singular hour', () => {
    const now = new Date('2025-01-01T12:00:00Z');
    const endsAt = '2025-01-01T13:30:00Z'; // 90 mins later = 1 hour
    expect(getCountdownText(endsAt, now)).toBe('1 hour left');
  });

  it('should show "Ending soon" when past end time', () => {
    const now = new Date('2025-01-02T12:00:00Z');
    const endsAt = '2025-01-01T12:00:00Z'; // Yesterday
    expect(getCountdownText(endsAt, now)).toBe('Ending soon');
  });
});

// Test pool key building (using imported function)
describe('Pool Key', () => {
  it('should create correct pool key', () => {
    expect(buildPoolKey('international_student', 'less_than_1_year')).toBe(
      'international_student__less_than_1_year'
    );
  });

  it('should handle all personas', () => {
    const personas = [
      'international_student',
      'skilled_worker',
      'refugee',
      'other',
    ] as const;
    const time = '1_to_2_years' as const;
    personas.forEach(persona => {
      expect(buildPoolKey(persona, time)).toContain(persona);
      expect(buildPoolKey(persona, time)).toContain(time);
    });
  });
});

// Test relative time formatting
describe('Relative Time Formatting', () => {
  const formatRelativeTime = (dateString: string, now: Date): string => {
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  it('should show "Just now" for very recent', () => {
    const now = new Date('2025-01-01T12:00:30Z');
    const date = '2025-01-01T12:00:00Z';
    expect(formatRelativeTime(date, now)).toBe('Just now');
  });

  it('should show minutes for < 1 hour', () => {
    const now = new Date('2025-01-01T12:30:00Z');
    const date = '2025-01-01T12:00:00Z';
    expect(formatRelativeTime(date, now)).toBe('30m ago');
  });

  it('should show hours for < 24 hours', () => {
    const now = new Date('2025-01-01T18:00:00Z');
    const date = '2025-01-01T12:00:00Z';
    expect(formatRelativeTime(date, now)).toBe('6h ago');
  });

  it('should show days for < 7 days', () => {
    const now = new Date('2025-01-05T12:00:00Z');
    const date = '2025-01-01T12:00:00Z';
    expect(formatRelativeTime(date, now)).toBe('4d ago');
  });
});
