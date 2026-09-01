import { getInitials } from '@/utils/initials';

describe('getInitials', () => {
  it('takes the first letter of the first two words, uppercased', () => {
    expect(getInitials('Burnaby Neighbourhood House')).toBe('BN');
    expect(getInitials('Vancouver Public Library')).toBe('VP');
    expect(getInitials('YMCA BC')).toBe('YB');
  });
  it('returns a single letter for one-word names', () => {
    expect(getInitials('AMSSA')).toBe('A');
    expect(getInitials('DIVERSEcity')).toBe('D');
  });
  it('handles extra whitespace and empty input', () => {
    expect(getInitials('  Surrey   Libraries ')).toBe('SL');
    expect(getInitials('')).toBe('');
  });
});
