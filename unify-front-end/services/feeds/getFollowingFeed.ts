import { supabase } from '@/lib/supabase';
import { FeedResponse } from '@/types/feeds/feedResponse';
import { PostData } from '@/types/feeds/post';
import { User } from '@/types/user';

export const getFeedFollowing = async (
  cursor?: string,
  limit = 20
): Promise<FeedResponse> => {
  try {
    // Get current user's ID
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // PLACEHOLDER: For now just getting posts where user_id equals current user's ID
    const { data, error } = await supabase
      .from('posts')
      .select(
        `
        id,
        content,
        created_at,
        user_id,
        users!user_id(
          id,
          username
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(
        cursor ? parseInt(cursor) : 0,
        (cursor ? parseInt(cursor) : 0) + limit - 1
      );

    if (error) {
      throw new Error(`Failed to fetch following feed: ${error.message}`);
    }

    // Transform data to match your Post type
    const transformedPosts: PostData[] = (data || []).map((post: any) => ({
      id: post.id,
      user: {
        id: post.users.id,
        username: post.users.username,
        name: post.users.username,
      } as User,
      time: post.created_at,
      description: post.content,
    }));

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
