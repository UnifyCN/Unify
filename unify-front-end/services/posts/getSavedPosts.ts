import { supabase } from '@/lib/supabase';
import { PostData } from '@/types/feeds/post';
import { User } from '@/types/user';

export const getSavedPosts = async (
  cursor?: string,
  limit = 20
): Promise<{ posts: PostData[]; next_cursor?: string }> => {
  try {
    // Get current user's ID
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get saved posts with user data
    const { data, error } = await supabase
      .from('post_saves')
      .select(
        `
        post_id,
        posts!post_id(
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
            username
          ),
          groups!group_id(
            id,
            group_name
          )
        )
      `
      )
      .eq('user_id', user.id)
      // .order('posts.created_at', { ascending: false }) // this doesn't work
      .range(
        cursor ? parseInt(cursor) : 0,
        (cursor ? parseInt(cursor) : 0) + limit - 1
      );

    if (error) {
      throw new Error(`Failed to fetch saved posts: ${error.message}`);
    }

    // Transform data to match PostData type
    const transformedPosts: PostData[] = (data || []).map((save: any) => ({
      id: save.posts.id,
      user: {
        id: save.posts.users.id,
        username: save.posts.users.username,
        name: save.posts.users.username,
      } as User,
      time: save.posts.created_at,
      title: save.posts.title,
      description: save.posts.description,
      group: save.posts.groups?.group_name || null,
    }));

    return {
      posts: transformedPosts,
      next_cursor:
        transformedPosts.length === limit
          ? String(cursor ? parseInt(cursor) + limit : limit)
          : undefined,
    };
  } catch (error) {
    console.error('Error fetching saved posts:', error);
    throw error;
  }
};
