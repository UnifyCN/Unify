import { supabase } from '@/lib/supabase';
import { FeedResponse } from '@/types/feeds/feedResponse';
import { PostData } from '@/types/feeds/post';
import { PostDto } from '@/types/feeds/postDto';
import { transformPostDtos } from '@/utils/postTransform';
import { getBlockedUserIdsForUser } from '@/services/users/getBlockedUserIds';
import { enrichPostsWithMetadata } from '@/services/posts/postMetadata';

export const getFeedFollowing = async (
  cursor?: string,
  limit: number = 20
): Promise<FeedResponse> => {
  try {
    // Get current user's ID
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // First, get the list of user IDs that the current user is following
    const { data: followingData, error: followingError } = await supabase
      .from('user_followers')
      .select('following_id')
      .eq('follower_id', user.id);

    if (followingError) {
      throw new Error(
        `Failed to fetch following list: ${followingError.message}`
      );
    }

    // Extract the user IDs and filter out blocked users
    const blockedIds = await getBlockedUserIdsForUser(user.id);
    const followingUserIds = (
      followingData?.map(item => item.following_id) || []
    ).filter(id => !blockedIds.includes(id));

    // If not following anyone (or all are blocked), return empty feed
    if (followingUserIds.length === 0) {
      return {
        posts: [],
        next_cursor: undefined,
      };
    }

    // Get posts from users that the current user is following
    const { data, error } = await supabase
      .from('posts')
      .select(
        `
        id,
        title,
        content,
        like_count,
        comment_count,
        created_at,
        user_id,
        group_id,
        users!user_id(
          id,
          username,
          profile_picture_url
        ),
        groups!group_id(
          id,
          group_name
        ),
        post_image_urls
      `
      )
      .in('user_id', followingUserIds)
      .order('created_at', { ascending: false })
      .range(
        cursor ? parseInt(cursor) : 0,
        (cursor ? parseInt(cursor) : 0) + limit - 1
      );

    if (error) {
      throw new Error(`Failed to fetch following feed: ${error.message}`);
    }

    // Transform data using helper function
    const transformedPosts: PostData[] = await enrichPostsWithMetadata(
      transformPostDtos(data as unknown as PostDto[])
    );

    return {
      posts: transformedPosts,
      next_cursor:
        transformedPosts.length === limit
          ? String(cursor ? parseInt(cursor) + limit : limit)
          : undefined,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Runtime is shutting down')
    ) {
      return { posts: [], next_cursor: undefined };
    }
    console.error('Error fetching following feed:', error);
    throw error;
  }
};
