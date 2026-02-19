import { supabase } from '@/lib/supabase';
import { FeedResponse } from '@/types/feeds/feedResponse';
import { PostData } from '@/types/feeds/post';
import { PostDto } from '@/types/feeds/postDto';
import { transformPostDtos } from '@/utils/postTransform';

/**
 * Get the For You feed with pinned posts appearing first on page 1.
 *
 * Page 1: All pinned posts (ordered by pinned_at DESC) followed by non-pinned posts
 * Page 2+: Only non-pinned posts, using cursor-based pagination
 */
export const getForYouFeed = async (
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

    const isFirstPage = !cursor || cursor === '0';

    if (isFirstPage) {
      // Page 1: Fetch pinned posts first, then fill with non-pinned
      const { data: pinnedData, error: pinnedError } = await supabase
        .from('posts')
        .select(
          `
          id,
          title,
          content,
          created_at,
          user_id,
          group_id,
          is_pinned,
          pinned_at,
          users!user_id(
            id,
            username,
            profile_picture_url
          ),
          post_image_urls
        `
        )
        .is('group_id', null)
        .eq('is_pinned', true)
        .order('pinned_at', { ascending: false });

      if (pinnedError) {
        throw new Error(`Failed to fetch pinned posts: ${pinnedError.message}`);
      }

      const pinnedPosts = transformPostDtos(pinnedData as unknown as PostDto[]);

      // Calculate how many non-pinned posts we need to fill the page
      const remainingSlots = Math.max(0, limit - pinnedPosts.length);

      let nonPinnedPosts: PostData[] = [];
      let lastNonPinnedCreatedAt: string | undefined;

      if (remainingSlots > 0) {
        const { data: nonPinnedData, error: nonPinnedError } = await supabase
          .from('posts')
          .select(
            `
            id,
            title,
            content,
            created_at,
            user_id,
            group_id,
            is_pinned,
            users!user_id(
              id,
              username,
              profile_picture_url
            ),
            post_image_urls
          `
          )
          .is('group_id', null)
          .eq('is_pinned', false)
          .order('created_at', { ascending: false })
          .limit(remainingSlots);

        if (nonPinnedError) {
          throw new Error(
            `Failed to fetch non-pinned posts: ${nonPinnedError.message}`
          );
        }

        nonPinnedPosts = transformPostDtos(
          nonPinnedData as unknown as PostDto[]
        );

        // Use the last non-pinned post's created_at as cursor for next page
        if (nonPinnedData && nonPinnedData.length > 0) {
          lastNonPinnedCreatedAt =
            nonPinnedData[nonPinnedData.length - 1].created_at;
        }
      }

      const allPosts = [...pinnedPosts, ...nonPinnedPosts];

      return {
        posts: allPosts,
        // Use created_at of last non-pinned post as cursor
        next_cursor: lastNonPinnedCreatedAt || undefined,
      };
    } else {
      // Page 2+: Only non-pinned posts, using cursor (created_at of last post)
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
          is_pinned,
          users!user_id(
            id,
            username,
            profile_picture_url
          ),
          post_image_urls
        `
        )
        .is('group_id', null)
        .eq('is_pinned', false)
        .lt('created_at', cursor) // Keyset pagination: get posts older than cursor
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch feed: ${error.message}`);
      }

      const transformedPosts: PostData[] = transformPostDtos(
        data as unknown as PostDto[]
      );

      // Use created_at of last post as next cursor
      const lastCreatedAt =
        data && data.length > 0 ? data[data.length - 1].created_at : undefined;

      return {
        posts: transformedPosts,
        next_cursor:
          transformedPosts.length === limit ? lastCreatedAt : undefined,
      };
    }
  } catch (error) {
    console.error('Error fetching for you feed:', error);
    throw error;
  }
};
