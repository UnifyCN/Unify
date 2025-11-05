import { supabase } from '@/lib/supabase';
import { PostData } from '@/types/feeds/post';
import { PostDto } from '@/types/feeds/postDto';
import { transformPostDtos } from '@/utils/postTransform';

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
				title,
				content,
				created_at,
				user_id,
				group_id,
				users!user_id(
					id,
          profile_picture_url,
					username
				),
				groups!group_id(
					id,
					group_name
				)
			`
    );
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%`);
    }
    // Order by created_at descending (posts without groups are included)
    query = query.order('created_at', { ascending: false });
    query = query.range(
      cursor ? parseInt(cursor) : 0,
      (cursor ? parseInt(cursor) : 0) + limit - 1
    );

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch all posts: ${error.message}`);
    }

    // Transform data using helper function
    // Note: Posts without groups (group_id is null) are included - groups will be null
    const transformedPosts: PostData[] = transformPostDtos(
      (data || []).filter((row: any) => row.users) as unknown as PostDto[]
    );

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
