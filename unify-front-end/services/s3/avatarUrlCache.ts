import { getProfilePictureUrl } from '@/services/s3/uploadProfilePicture';

const DEFAULT_TTL_MS = 4 * 60 * 1000;
const REFRESH_BUFFER_MS = 30 * 1000;

interface AvatarCacheEntry {
  url: string;
  expiresAt: number;
}

const avatarUrlCache = new Map<string, AvatarCacheEntry>();
const inflightRequests = new Map<string, Promise<string | undefined>>();

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);

export const normalizeAvatarSource = (
  profilePictureUrl?: string | null
): string | undefined => {
  if (!profilePictureUrl) {
    return undefined;
  }
  const normalized = profilePictureUrl.trim();
  return normalized.length > 0 ? normalized : undefined;
};

export const parseSignedUrlExpiry = (url: string): number | null => {
  try {
    const parsed = new URL(url);
    const amzDate = parsed.searchParams.get('X-Amz-Date');
    const amzExpires = parsed.searchParams.get('X-Amz-Expires');

    if (!amzDate || !amzExpires) {
      return null;
    }

    const year = Number(amzDate.slice(0, 4));
    const month = Number(amzDate.slice(4, 6)) - 1;
    const day = Number(amzDate.slice(6, 8));
    const hour = Number(amzDate.slice(9, 11));
    const minute = Number(amzDate.slice(11, 13));
    const second = Number(amzDate.slice(13, 15));
    const baseMs = Date.UTC(year, month, day, hour, minute, second);

    if (!Number.isFinite(baseMs) || Number.isNaN(baseMs)) {
      return null;
    }

    const expiresInSeconds = Number(amzExpires);
    if (!Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0) {
      return null;
    }

    return baseMs + expiresInSeconds * 1000;
  } catch {
    return null;
  }
};

const isCacheValid = (entry: AvatarCacheEntry) =>
  entry.expiresAt - Date.now() > REFRESH_BUFFER_MS;

export const clearAvatarUrlCache = (profilePictureUrl?: string | null): void => {
  const normalized = normalizeAvatarSource(profilePictureUrl);

  if (!normalized) {
    avatarUrlCache.clear();
    inflightRequests.clear();
    return;
  }

  if (isHttpUrl(normalized)) {
    return;
  }

  avatarUrlCache.delete(normalized);
  inflightRequests.delete(normalized);
};

export const resolveAvatarUrl = async (
  profilePictureUrl?: string | null
): Promise<string | undefined> => {
  const normalized = normalizeAvatarSource(profilePictureUrl);

  if (!normalized) {
    return undefined;
  }

  if (isHttpUrl(normalized)) {
    return normalized;
  }

  const cached = avatarUrlCache.get(normalized);
  if (cached && isCacheValid(cached)) {
    return cached.url;
  }

  const inflight = inflightRequests.get(normalized);
  if (inflight) {
    return inflight;
  }

  const request = getProfilePictureUrl(normalized)
    .then(signedUrl => {
      const expiresAt = parseSignedUrlExpiry(signedUrl) ?? Date.now() + DEFAULT_TTL_MS;
      avatarUrlCache.set(normalized, {
        url: signedUrl,
        expiresAt,
      });
      return signedUrl;
    })
    .catch(error => {
      avatarUrlCache.delete(normalized);
      throw error;
    })
    .finally(() => {
      inflightRequests.delete(normalized);
    });

  inflightRequests.set(normalized, request);
  return request;
};

export const prefetchAvatarUrls = async (
  profilePictureUrls: (string | null | undefined)[]
): Promise<void> => {
  const uniqueValues = Array.from(
    new Set(
      profilePictureUrls
        .map(normalizeAvatarSource)
        .filter(
          (value): value is string => !!value && !isHttpUrl(value)
        )
    )
  );

  if (uniqueValues.length === 0) {
    return;
  }

  await Promise.all(
    uniqueValues.map(url =>
      resolveAvatarUrl(url).catch(() => undefined)
    )
  );
};
