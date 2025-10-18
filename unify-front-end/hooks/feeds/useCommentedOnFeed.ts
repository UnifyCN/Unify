import { getCommentedOnFeed } from '@/services/feeds/getCommentedOnFeed';
import { useFeedFactoryWithParams } from './useFeedFactory';

export const useCommentedOnFeed = (userId: string) => {
  return useFeedFactoryWithParams({
    queryKey: ['feed', 'commentedOn'],
    queryFn: (params, pageParam) =>
      getCommentedOnFeed({ userId: params, cursor: pageParam }),
    params: userId,
  });
};
