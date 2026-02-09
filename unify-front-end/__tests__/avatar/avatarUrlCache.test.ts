import {
  clearAvatarUrlCache,
  normalizeAvatarSource,
  parseSignedUrlExpiry,
  resolveAvatarUrl,
} from '@/services/s3/avatarUrlCache';
import { getProfilePictureUrl } from '@/services/s3/uploadProfilePicture';

jest.mock('@/services/s3/uploadProfilePicture', () => ({
  getProfilePictureUrl: jest.fn(),
}));

const mockedGetProfilePictureUrl = getProfilePictureUrl as jest.MockedFunction<
  typeof getProfilePictureUrl
>;

describe('avatarUrlCache', () => {
  beforeEach(() => {
    clearAvatarUrlCache();
    jest.clearAllMocks();
  });

  it('normalizes avatar source values', () => {
    expect(normalizeAvatarSource(undefined)).toBeUndefined();
    expect(normalizeAvatarSource('   ')).toBeUndefined();
    expect(normalizeAvatarSource(' key/path ')).toBe('key/path');
  });

  it('returns http source as-is without signing', async () => {
    const source = 'https://cdn.example.com/avatar.png';
    const resolved = await resolveAvatarUrl(source);

    expect(resolved).toBe(source);
    expect(mockedGetProfilePictureUrl).not.toHaveBeenCalled();
  });

  it('dedupes in-flight requests and caches signed urls', async () => {
    mockedGetProfilePictureUrl.mockResolvedValue(
      'https://signed.example.com/avatar?X-Amz-Date=20260101T120000Z&X-Amz-Expires=300'
    );
    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValue(new Date('2026-01-01T12:01:00.000Z').getTime());

    const [first, second] = await Promise.all([
      resolveAvatarUrl('avatars/user-1.jpg'),
      resolveAvatarUrl('avatars/user-1.jpg'),
    ]);

    expect(first).toBe(second);
    expect(mockedGetProfilePictureUrl).toHaveBeenCalledTimes(1);

    const third = await resolveAvatarUrl('avatars/user-1.jpg');
    expect(third).toBe(first);
    expect(mockedGetProfilePictureUrl).toHaveBeenCalledTimes(1);

    nowSpy.mockRestore();
  });

  it('refreshes signed url near expiry', async () => {
    mockedGetProfilePictureUrl
      .mockResolvedValueOnce(
        'https://signed.example.com/a?X-Amz-Date=20260101T120000Z&X-Amz-Expires=60'
      )
      .mockResolvedValueOnce(
        'https://signed.example.com/b?X-Amz-Date=20260101T120100Z&X-Amz-Expires=60'
      );

    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValue(new Date('2026-01-01T12:00:10.000Z').getTime());

    const first = await resolveAvatarUrl('avatars/user-2.jpg');
    expect(first).toContain('/a?');
    expect(mockedGetProfilePictureUrl).toHaveBeenCalledTimes(1);

    nowSpy.mockReturnValue(new Date('2026-01-01T12:00:40.000Z').getTime());

    const second = await resolveAvatarUrl('avatars/user-2.jpg');
    expect(second).toContain('/b?');
    expect(mockedGetProfilePictureUrl).toHaveBeenCalledTimes(2);

    nowSpy.mockRestore();
  });

  it('clears cache entries for specific key and re-signs', async () => {
    mockedGetProfilePictureUrl
      .mockResolvedValueOnce(
        'https://signed.example.com/c?X-Amz-Date=20260101T120000Z&X-Amz-Expires=300'
      )
      .mockResolvedValueOnce(
        'https://signed.example.com/d?X-Amz-Date=20260101T120100Z&X-Amz-Expires=300'
      );

    const first = await resolveAvatarUrl('avatars/user-3.jpg');
    clearAvatarUrlCache('avatars/user-3.jpg');
    const second = await resolveAvatarUrl('avatars/user-3.jpg');

    expect(first).toContain('/c?');
    expect(second).toContain('/d?');
    expect(mockedGetProfilePictureUrl).toHaveBeenCalledTimes(2);
  });

  it('parses signed url expiry timestamp', () => {
    const expiresAt = parseSignedUrlExpiry(
      'https://signed.example.com/avatar?X-Amz-Date=20260101T120000Z&X-Amz-Expires=300'
    );

    expect(expiresAt).toBe(new Date('2026-01-01T12:05:00.000Z').getTime());
  });
});
