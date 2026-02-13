import { useQuery } from '@tanstack/react-query';
import {
  normalizeAvatarSource,
  resolveAvatarUrl,
} from '@/services/s3/avatarUrlCache';

export const useResolvedAvatarUrl = (profilePictureUrl?: string | null) => {
  const normalizedSource = normalizeAvatarSource(profilePictureUrl);

  const query = useQuery({
    queryKey: ['resolvedAvatarUrl', normalizedSource],
    enabled: !!normalizedSource,
    queryFn: () => resolveAvatarUrl(normalizedSource),
    staleTime: 30 * 1000,
    retry: 1,
  });

  return {
    resolvedAvatarUrl: query.data,
    hasAvatarSource: !!normalizedSource,
    ...query,
  };
};
