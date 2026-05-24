import { sanitizeFirstName } from '@/utils/sanitizeFirstName';

describe('sanitizeFirstName', () => {
  it('trims leading and trailing whitespace', () => {
    expect(sanitizeFirstName('  Savar  ')).toBe('Savar');
  });

  it('collapses internal whitespace runs to a single space', () => {
    expect(sanitizeFirstName('Maria   del   Carmen')).toBe('Maria del Carmen');
  });

  it('strips emoji from the input', () => {
    expect(sanitizeFirstName('Savar 🌸✨')).toBe('Savar');
    expect(sanitizeFirstName('🦄Savar')).toBe('Savar');
  });

  it('truncates to 24 characters after stripping and trimming', () => {
    const long = 'Alexandrovichkonstantinopol';
    expect(sanitizeFirstName(long)).toBe(long.substring(0, 24));
    expect(sanitizeFirstName(long).length).toBe(24);
  });

  it('returns empty string when input is only whitespace', () => {
    expect(sanitizeFirstName('   ')).toBe('');
  });

  it('returns empty string when input is only emoji', () => {
    expect(sanitizeFirstName('🌸🦄✨')).toBe('');
  });

  it('preserves Devanagari, Spanish accents, Vietnamese diacritics', () => {
    expect(sanitizeFirstName('सावर')).toBe('सावर');
    expect(sanitizeFirstName('María')).toBe('María');
    expect(sanitizeFirstName('Nguyễn')).toBe('Nguyễn');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeFirstName('')).toBe('');
  });
});
