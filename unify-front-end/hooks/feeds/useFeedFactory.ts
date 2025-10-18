import { useInfiniteQuery } from '@tanstack/react-query';
import { FeedResponse } from '@/types/feeds/feedResponse';

interface UseFeedOptions {
  queryKey: string[];
  queryFn: (pageParam?: string) => Promise<FeedResponse>;
}

interface UseFeedWithParamsOptions<T> {
  queryKey: string[];
  queryFn: (params: T, pageParam?: string) => Promise<FeedResponse>;
  params: T;
  enabled?: boolean;
}

/**
 * Generic hook factory for feed queries
 * Reduces boilerplate for simple feed hooks
 */
export const useFeedFactory = ({ queryKey, queryFn }: UseFeedOptions) => {
  return useInfiniteQuery<
    FeedResponse,
    Error,
    FeedResponse,
    string[],
    string | undefined
  >({
    queryKey,
    queryFn: ({ pageParam }) => queryFn(pageParam),
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.next_cursor,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Generic hook factory for parameterized feed queries
 * Reduces boilerplate for feed hooks that take parameters
 */
export const useFeedFactoryWithParams = <T>({
  queryKey,
  queryFn,
  params,
  enabled = true,
}: UseFeedWithParamsOptions<T>) => {
  return useInfiniteQuery<
    FeedResponse,
    Error,
    FeedResponse,
    string[],
    string | undefined
  >({
    queryKey: [...queryKey, JSON.stringify(params)],
    queryFn: ({ pageParam }) => queryFn(params, pageParam),
    enabled,
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.next_cursor,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};
