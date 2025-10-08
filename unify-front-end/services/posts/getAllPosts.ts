import { supabase } from '@/lib/supabase';
import { PostData } from '@/types/feeds/post';
import { User } from '@/types/user';
import { Search } from 'lucide-react-native';

export const getAllPosts = async (
  cursor?: string,
  limit = 20, //LIKELY CHANGE
  searchQuery?: string
): Promise<{ posts: PostData[]; next_cursor?: string }> => {
  try {
    // Get saved posts with user data
    let query = supabase.from('posts').select(
      `
          id,
          content,
          like_count,
          comment_count,
          created_at,
          title,
          user_id,
          users:user_id (
            id,
            username
          ),
          group_id,
          groups:group_id (
            id,
            group_name
          )
      `
    );
    if (searchQuery) {
      query = query.or(
        `title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`
      );
    }
    // .order('posts.created_at', { ascending: false }) // this doesn't work
    query = query.range(
      cursor ? parseInt(cursor) : 0,
      (cursor ? parseInt(cursor) : 0) + limit - 1
    );

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch all posts: ${error.message}`);
    }

    // Transform data to match PostData type
    const transformedPosts: PostData[] = (data || [])
      .filter((row: any) => row.users)
      .map((row: any) => ({
        id: row.id,
        user: {
          id: row.users.id,
          username: row.users.username,
          name: row.users.username,
        } as User,
        group: row.groups
          ? {
              id: row.groups.id,
              name: row.groups.group_name,
            }
          : null,
        title: row.title ?? 'No-Title',
        time: row.created_at,
        description: row.content,
      }));

    return {
      posts: transformedPosts,
      next_cursor:
        transformedPosts.length === limit
          ? String(cursor ? parseInt(cursor) + limit : limit)
          : undefined,
    };
  } catch (error) {
    console.error('Error fetching all posts:', error);
    throw error;
  }
};
