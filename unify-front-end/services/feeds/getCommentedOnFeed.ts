import { supabase } from '@/lib/supabase';
import { FeedResponse } from '@/types/feeds/feedResponse';
import { PostData } from '@/types/feeds/post';
import { PostDto } from '@/types/feeds/postDto';
import { transformPostDto } from '@/utils/postTransform';

interface GetCommentedOnFeedProps {
  cursor?: string;
  limit: number;
  userId: string;
}

export const getCommentedOnFeed = async ({
  userId,
  limit = 20,
  cursor,
}: GetCommentedOnFeedProps): Promise<FeedResponse> => {
  try {
    const { data, error } = await supabase
      .from('post_comments')
      .select(
        `
        posts!post_id(
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
          ),
          post_image_urls
        )
      `
      )
      .eq('user_id', userId)
      .order('posts(created_at)', { ascending: false })
      .range(
        cursor ? parseInt(cursor) : 0,
        (cursor ? parseInt(cursor) : 0) + limit - 1
      );

    if (error) {
      throw new Error(`Failed to fetch commented on feed: ${error.message}`);
    }

    // Use Map to deduplicate by post ID
    const postsMap = new Map();

    (data || []).forEach((item: any) => {
      if (item.posts && item.posts.users.id !== userId) {
        const postDto: PostDto = item.posts;
        // Only add if we haven't seen this post ID before
        if (!postsMap.has(postDto.id)) {
          postsMap.set(postDto.id, transformPostDto(postDto));
        }
      }
    });

    const uniquePosts: PostData[] = Array.from(postsMap.values());

    return {
      posts: uniquePosts,
      next_cursor:
        uniquePosts.length === limit
          ? String(cursor ? parseInt(cursor) + limit : limit)
          : undefined,
    };
  } catch (error) {
    console.error('Error fetching commented on feed:', error);
    throw error;
  }
};
