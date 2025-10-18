import { getPostsByGroup } from '@/services/posts/getPostsByGroup';
import { useFeedFactoryWithParams } from './useFeedFactory';

export const useGroupPosts = (groupId?: number) => {
  return useFeedFactoryWithParams({
    queryKey: ['group', 'posts'],
    queryFn: (params, pageParam) => getPostsByGroup(params, pageParam),
    params: groupId!,
    enabled: !!groupId,
  });
};
