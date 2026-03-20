import { Image as ExpoImage } from 'expo-image';
import { resolveAvatarUrl } from '@/services/s3/avatarUrlCache';

export const resolvePostImageUrls = async (
  keys: string[]
): Promise<string[]> => {
  const urls = await Promise.all(
    keys.map(key =>
      resolveAvatarUrl(key).catch(err => {
        console.error('Failed to resolve post image url for key:', key, err);
        return undefined;
      })
    )
  );
  return urls.filter((url): url is string => !!url);
};

export const prefetchPostImageUrls = async (
  keys: (string | null | undefined)[]
): Promise<void> => {
  const uniqueKeys = Array.from(
    new Set(
      keys.filter(
        (key): key is string => typeof key === 'string' && key.trim().length > 0
      )
    )
  );

  if (uniqueKeys.length === 0) {
    return;
  }

  const urls = await resolvePostImageUrls(uniqueKeys);

  if (urls.length > 0) {
    await ExpoImage.prefetch(urls);
  }
};
