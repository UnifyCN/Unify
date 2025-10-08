import { supabase } from '@/lib/supabase';
import { FeedResponse } from '@/types/feeds/feedResponse';
import { PostData } from '@/types/feeds/post';
import { User } from '@/types/user';

export const getUserPosts = async (
  userId?: string,
  cursor?: string,
  limit = 20
): Promise<FeedResponse> => {
  try {
    let targetUserId = userId;

    // If no userId provided, get current user's ID
    if (!targetUserId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      targetUserId = user.id;
    }

    // Get posts created by the user
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
          username
        ),
        groups!group_id(
          id,
          group_name
        )
      `
      )
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .range(
        cursor ? parseInt(cursor) : 0,
        (cursor ? parseInt(cursor) : 0) + limit - 1
      );

    if (error) {
      throw new Error(`Failed to fetch user posts: ${error.message}`);
    }

    // Transform data to match your PostData type
    const transformedPosts: PostData[] = (data || []).map((post: any) => ({
      id: post.id,
      user: {
        id: post.users.id,
        username: post.users.username,
        name: post.users.username,
      } as User,
      time: post.created_at,
      title: post.title,
      description: post.content,
      group: post.groups?
      { id: post.groups.id, name: post.groups.group_name }
      : null,
    }));

    return {
      posts: transformedPosts,
      next_cursor:
        transformedPosts.length === limit
          ? String(cursor ? parseInt(cursor) + limit : limit)
          : undefined,
    };
  } catch (error) {
    console.error('Error fetching user posts:', error);
    throw error;
  }
};
