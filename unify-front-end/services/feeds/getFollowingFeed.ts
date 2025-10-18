import { supabase } from '@/lib/supabase';
import { FeedResponse } from '@/types/feeds/feedResponse';
import { PostData } from '@/types/feeds/post';
import { PostDto } from '@/types/feeds/postDto';
import { transformPostDtos } from '@/utils/postTransform';

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

    // Extract the user IDs
    const followingUserIds =
      followingData?.map(item => item.following_id) || [];

    // If not following anyone, return empty feed
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
        )
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
    const transformedPosts: PostData[] = transformPostDtos(
      data as unknown as PostDto[]
    );

    return {
      posts: transformedPosts,
      next_cursor:
        transformedPosts.length === limit
          ? String(cursor ? parseInt(cursor) + limit : limit)
          : undefined,
    };
  } catch (error) {
    console.error('Error fetching following feed:', error);
    throw error;
  }
};
