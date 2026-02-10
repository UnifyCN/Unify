import {
  clearAvatarUrlCache,
  normalizeAvatarSource,
  parseSignedUrlExpiry,
  prefetchAvatarUrls,
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
    mockedGetProfilePictureUrl.mockReset();
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

  it('returns undefined for nullish sources without signing', async () => {
    await expect(resolveAvatarUrl(undefined)).resolves.toBeUndefined();
    await expect(resolveAvatarUrl(null)).resolves.toBeUndefined();
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

  it('prefetches unique keys and seeds cache for later resolves', async () => {
    mockedGetProfilePictureUrl
      .mockResolvedValueOnce(
        'https://signed.example.com/u1?X-Amz-Date=20260101T120000Z&X-Amz-Expires=300'
      )
      .mockResolvedValueOnce(
        'https://signed.example.com/u2?X-Amz-Date=20260101T120000Z&X-Amz-Expires=300'
      );

    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValue(new Date('2026-01-01T12:02:00.000Z').getTime());

    await prefetchAvatarUrls([
      'avatars/user-1.jpg',
      'avatars/user-2.jpg',
      'avatars/user-1.jpg',
      'https://cdn.example.com/http-only.png',
      null,
      undefined,
      ' ',
    ]);

    expect(mockedGetProfilePictureUrl).toHaveBeenCalledTimes(2);
    expect(mockedGetProfilePictureUrl).toHaveBeenNthCalledWith(
      1,
      'avatars/user-1.jpg'
    );
    expect(mockedGetProfilePictureUrl).toHaveBeenNthCalledWith(
      2,
      'avatars/user-2.jpg'
    );

    const one = await resolveAvatarUrl('avatars/user-1.jpg');
    const two = await resolveAvatarUrl('avatars/user-2.jpg');

    expect(one).toContain('/u1?');
    expect(two).toContain('/u2?');
    expect(mockedGetProfilePictureUrl).toHaveBeenCalledTimes(2);
    nowSpy.mockRestore();
  });

  it('treats prefetch empty input as no-op', async () => {
    await prefetchAvatarUrls([]);
    expect(mockedGetProfilePictureUrl).not.toHaveBeenCalled();
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

  it('does not cache failed signing and retries successfully later', async () => {
    mockedGetProfilePictureUrl
      .mockRejectedValueOnce(new Error('sign failed'))
      .mockResolvedValueOnce(
        'https://signed.example.com/retry?X-Amz-Date=20260101T120000Z&X-Amz-Expires=300'
      );

    await expect(resolveAvatarUrl('avatars/user-err.jpg')).rejects.toThrow(
      'sign failed'
    );
    expect(mockedGetProfilePictureUrl).toHaveBeenCalledTimes(1);

    const resolved = await resolveAvatarUrl('avatars/user-err.jpg');
    expect(resolved).toContain('/retry?');
    expect(mockedGetProfilePictureUrl).toHaveBeenCalledTimes(2);
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

  it('clears all cached keys when no source is provided', async () => {
    mockedGetProfilePictureUrl
      .mockResolvedValueOnce(
        'https://signed.example.com/k1?X-Amz-Date=20260101T120000Z&X-Amz-Expires=300'
      )
      .mockResolvedValueOnce(
        'https://signed.example.com/k2?X-Amz-Date=20260101T120000Z&X-Amz-Expires=300'
      )
      .mockResolvedValueOnce(
        'https://signed.example.com/k1b?X-Amz-Date=20260101T120200Z&X-Amz-Expires=300'
      )
      .mockResolvedValueOnce(
        'https://signed.example.com/k2b?X-Amz-Date=20260101T120200Z&X-Amz-Expires=300'
      );

    await resolveAvatarUrl('avatars/key-1.jpg');
    await resolveAvatarUrl('avatars/key-2.jpg');
    expect(mockedGetProfilePictureUrl).toHaveBeenCalledTimes(2);

    clearAvatarUrlCache();

    const key1 = await resolveAvatarUrl('avatars/key-1.jpg');
    const key2 = await resolveAvatarUrl('avatars/key-2.jpg');
    expect(key1).toContain('/k1b?');
    expect(key2).toContain('/k2b?');
    expect(mockedGetProfilePictureUrl).toHaveBeenCalledTimes(4);
  });

  it('prevents stale in-flight response from being re-cached after clear', async () => {
    let releasePromise: ((value: string) => void) | undefined;
    const deferredPromise = new Promise<string>(resolve => {
      releasePromise = resolve;
    });

    mockedGetProfilePictureUrl
      .mockReturnValueOnce(deferredPromise)
      .mockResolvedValueOnce(
        'https://signed.example.com/fresh?X-Amz-Date=20260101T120100Z&X-Amz-Expires=300'
      );

    const inflight = resolveAvatarUrl('avatars/race.jpg');
    clearAvatarUrlCache('avatars/race.jpg');
    releasePromise?.(
      'https://signed.example.com/stale?X-Amz-Date=20260101T120000Z&X-Amz-Expires=300'
    );

    await expect(inflight).resolves.toContain('/stale?');

    const next = await resolveAvatarUrl('avatars/race.jpg');
    expect(next).toContain('/fresh?');
    expect(mockedGetProfilePictureUrl).toHaveBeenCalledTimes(2);
  });

  it('keeps fresh cache when stale in-flight request rejects after clear', async () => {
    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValue(new Date('2026-01-01T12:02:00.000Z').getTime());

    let rejectPromise: ((reason?: Error) => void) | undefined;
    const deferredPromise = new Promise<string>((_resolve, reject) => {
      rejectPromise = reject;
    });

    mockedGetProfilePictureUrl
      .mockReturnValueOnce(deferredPromise)
      .mockResolvedValueOnce(
        'https://signed.example.com/fresh-race?X-Amz-Date=20260101T120100Z&X-Amz-Expires=300'
      );

    const inflight = resolveAvatarUrl('avatars/race-reject.jpg');
    clearAvatarUrlCache('avatars/race-reject.jpg');

    const fresh = await resolveAvatarUrl('avatars/race-reject.jpg');
    expect(fresh).toContain('/fresh-race?');

    rejectPromise?.(new Error('stale request failed'));
    await expect(inflight).rejects.toThrow('stale request failed');

    const next = await resolveAvatarUrl('avatars/race-reject.jpg');
    expect(next).toContain('/fresh-race?');
    expect(mockedGetProfilePictureUrl).toHaveBeenCalledTimes(2);

    nowSpy.mockRestore();
  });

  it('parses signed url expiry timestamp', () => {
    const expiresAt = parseSignedUrlExpiry(
      'https://signed.example.com/avatar?X-Amz-Date=20260101T120000Z&X-Amz-Expires=300'
    );

    expect(expiresAt).toBe(new Date('2026-01-01T12:05:00.000Z').getTime());
  });
});
