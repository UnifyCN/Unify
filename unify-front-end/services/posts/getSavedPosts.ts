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
          content,
          created_at,
          user_id,
          users!user_id(
            id,
            username
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
    const transformedPosts: PostData[] = (data || [])
      .map((save: any) => {
        const post = save.posts;
        if (!post) return null;

        return {
          id: post.id,
          user: {
            id: post.users.id,
            username: post.users.username,
            name: post.users.username,
          } as User,
          time: post.created_at,
          description: post.content,
          comments: 0, // TODO: Add comments count
          saved: true, // This post is saved by the current user
        };
      })
      .filter(Boolean) as PostData[];

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
