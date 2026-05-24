import { getTimeOfDayGreeting } from '@/utils/getTimeOfDayGreeting';

const at = (hour: number, minute = 0) => {
  const d = new Date(2026, 0, 1, hour, minute);
  return getTimeOfDayGreeting(d);
};

describe('getTimeOfDayGreeting', () => {
  it('returns evening before 5am', () => {
    expect(at(0)).toBe('evening');
    expect(at(4, 59)).toBe('evening');
  });

  it('returns morning from 5am through 11:59am', () => {
    expect(at(5)).toBe('morning');
    expect(at(8)).toBe('morning');
    expect(at(11, 59)).toBe('morning');
  });

  it('returns afternoon from 12pm through 4:59pm', () => {
    expect(at(12)).toBe('afternoon');
    expect(at(15)).toBe('afternoon');
    expect(at(16, 59)).toBe('afternoon');
  });

  it('returns evening from 5pm onward', () => {
    expect(at(17)).toBe('evening');
    expect(at(20)).toBe('evening');
    expect(at(23, 59)).toBe('evening');
  });

  it('defaults to current time when no Date is passed', () => {
    const result = getTimeOfDayGreeting();
    expect(['morning', 'afternoon', 'evening']).toContain(result);
  });
});
