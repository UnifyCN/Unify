import { getCommentedOnFeed } from '@/services/feeds/getCommentedOnFeed';
import { useFeedFactoryWithParams } from './useFeedFactory';

export const useCommentedOnFeed = (userId: string, limit: number = 20) => {
  return useFeedFactoryWithParams({
    queryKey: ['feed', 'commentedOn'],
    queryFn: (params, pageParam, limitParam) =>
      getCommentedOnFeed({
        userId: params,
        cursor: pageParam,
        limit: limitParam || limit,
      }),
    params: userId,
    limit,
  });
};
