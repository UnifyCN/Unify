import { useInfiniteQuery } from '@tanstack/react-query';
import { FeedResponse } from '@/types/feeds/feedResponse';

interface UseFeedOptions {
  queryKey: string[];
  queryFn: (pageParam?: string, limit?: number) => Promise<FeedResponse>;
  limit?: number;
}

interface UseFeedWithParamsOptions<T> {
  queryKey: string[];
  queryFn: (
    params: T,
    pageParam?: string,
    limit?: number
  ) => Promise<FeedResponse>;
  params: T;
  enabled?: boolean;
  limit?: number;
}

/**
 * Generic hook factory for feed queries
 * Reduces boilerplate for simple feed hooks
 */
export const useFeedFactory = ({
  queryKey,
  queryFn,
  limit = 20,
}: UseFeedOptions) => {
  return useInfiniteQuery<
    FeedResponse,
    Error,
    FeedResponse,
    string[],
    string | undefined
  >({
    queryKey,
    queryFn: ({ pageParam }) => queryFn(pageParam, limit),
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
  limit = 20,
}: UseFeedWithParamsOptions<T>) => {
  return useInfiniteQuery<
    FeedResponse,
    Error,
    FeedResponse,
    string[],
    string | undefined
  >({
    queryKey: [...queryKey, JSON.stringify(params)],
    queryFn: ({ pageParam }) => queryFn(params, pageParam, limit),
    enabled,
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.next_cursor,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};
