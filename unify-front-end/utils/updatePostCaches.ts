import { InfiniteData, QueryClient } from '@tanstack/react-query';
import { FeedResponse } from '@/types/feeds/feedResponse';
import { PostData } from '@/types/feeds/post';

const FEED_CACHE_PREFIXES = [
  ['feed'],
  ['userPosts'],
  ['group', 'posts'],
  ['searchPosts'],
  ['morePosts'],
] as const;

export interface PostCacheSnapshot {
  queryKey: readonly unknown[];
  data: unknown;
}

export const shouldUpdateFeedCache = (queryKey: readonly unknown[]) =>
  FEED_CACHE_PREFIXES.some(prefix =>
    prefix.every((segment, index) => queryKey[index] === segment)
  );

const updatePostList = (
  posts: PostData[],
  postId: number,
  updater: (post: PostData) => PostData
) =>
  posts.map(post => (post.id === postId ? updater(post) : post));

export const updatePostAcrossCaches = (
  queryClient: QueryClient,
  postId: number,
  updater: (post: PostData) => PostData
) => {
  queryClient.setQueriesData(
    {
      predicate: query =>
        Array.isArray(query.queryKey) && shouldUpdateFeedCache(query.queryKey),
    },
    (
      oldData:
        | InfiniteData<FeedResponse, string | undefined>
        | FeedResponse
        | undefined
    ) => {
      if (!oldData) {
        return oldData;
      }

      if ('pages' in oldData) {
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            posts: updatePostList(page.posts, postId, updater),
          })),
        };
      }

      if ('posts' in oldData) {
        return {
          ...oldData,
          posts: updatePostList(oldData.posts, postId, updater),
        };
      }

      return oldData;
    }
  );

  queryClient.setQueriesData(
    {
      predicate: query =>
        Array.isArray(query.queryKey) &&
        query.queryKey[0] === 'post' &&
        query.queryKey[1] === postId,
    },
    (oldData: PostData | null | undefined) => {
      if (!oldData || oldData.id !== postId) {
        return oldData;
      }

      return updater(oldData);
    }
  );
};

export const getSnapshotsForPost = (
  queryClient: QueryClient,
  postId: number
): PostCacheSnapshot[] => [
  ...queryClient
    .getQueriesData({
      queryKey: ['post-metadata'],
    })
    .map(([queryKey, data]) => ({ queryKey, data })),
  ...queryClient
    .getQueriesData({
      predicate: query =>
        Array.isArray(query.queryKey) &&
        (shouldUpdateFeedCache(query.queryKey) ||
          (query.queryKey[0] === 'post' && query.queryKey[1] === postId)),
    })
    .map(([queryKey, data]) => ({ queryKey, data })),
];
