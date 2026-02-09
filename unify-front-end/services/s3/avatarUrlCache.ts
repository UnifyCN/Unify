import { getProfilePictureUrl } from '@/services/s3/uploadProfilePicture';

const DEFAULT_TTL_MS = 4 * 60 * 1000;
const REFRESH_BUFFER_MS = 30 * 1000;
const MAX_CACHE_ENTRIES = 200;
const MAX_INFLIGHT_ENTRIES = 200;
const PRUNE_INTERVAL_MS = 1000;

interface AvatarCacheEntry {
  url: string;
  expiresAt: number;
}

const avatarUrlCache = new Map<string, AvatarCacheEntry>();
const inflightRequests = new Map<
  string,
  { requestId: symbol; promise: Promise<string | undefined> }
>();
let lastPruneTimestamp = 0;

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

export const clearAllAvatarUrlCache = (): void => {
  avatarUrlCache.clear();
  inflightRequests.clear();
  lastPruneTimestamp = 0;
};

const isCacheValid = (entry: AvatarCacheEntry) =>
  entry.expiresAt - Date.now() > REFRESH_BUFFER_MS;

const pruneExpiredCacheEntries = () => {
  const now = Date.now();
  for (const [key, entry] of avatarUrlCache.entries()) {
    if (entry.expiresAt <= now) {
      avatarUrlCache.delete(key);
    }
  }
};

const setWithCap = <T>(
  map: Map<string, T>,
  key: string,
  value: T,
  maxEntries: number
) => {
  if (map.has(key)) {
    map.delete(key);
  }
  map.set(key, value);

  while (map.size > maxEntries) {
    const oldestKey = map.keys().next().value;
    if (!oldestKey) {
      break;
    }
    map.delete(oldestKey);
  }
};

export const clearAvatarUrlCache = (profilePictureUrl: string | null): void => {
  const normalized = normalizeAvatarSource(profilePictureUrl);

  if (!normalized) {
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

  const now = Date.now();
  if (now - lastPruneTimestamp > PRUNE_INTERVAL_MS) {
    pruneExpiredCacheEntries();
    lastPruneTimestamp = now;
  }

  const cached = avatarUrlCache.get(normalized);
  if (cached && isCacheValid(cached)) {
    setWithCap(avatarUrlCache, normalized, cached, MAX_CACHE_ENTRIES);
    return cached.url;
  }

  const inflight = inflightRequests.get(normalized);
  if (inflight) {
    setWithCap(inflightRequests, normalized, inflight, MAX_INFLIGHT_ENTRIES);
    return inflight.promise;
  }

  const requestId = Symbol(normalized);
  const request = getProfilePictureUrl(normalized)
    .then(signedUrl => {
      const expiresAt = parseSignedUrlExpiry(signedUrl) ?? Date.now() + DEFAULT_TTL_MS;
      const currentInflight = inflightRequests.get(normalized);
      if (currentInflight?.requestId === requestId) {
        setWithCap(
          avatarUrlCache,
          normalized,
          {
            url: signedUrl,
            expiresAt,
          },
          MAX_CACHE_ENTRIES
        );
      }
      return signedUrl;
    })
    .catch(error => {
      const currentInflight = inflightRequests.get(normalized);
      if (currentInflight?.requestId === requestId) {
        avatarUrlCache.delete(normalized);
      }
      throw error;
    })
    .finally(() => {
      const currentInflight = inflightRequests.get(normalized);
      if (currentInflight?.requestId === requestId) {
        inflightRequests.delete(normalized);
      }
    });

  setWithCap(
    inflightRequests,
    normalized,
    {
      requestId,
      promise: request,
    },
    MAX_INFLIGHT_ENTRIES
  );
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
