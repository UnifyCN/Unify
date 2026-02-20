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
