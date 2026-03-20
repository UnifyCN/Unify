import { supabase } from '@/lib/supabase';
import { FeedResponse } from '@/types/feeds/feedResponse';
import { PostData } from '@/types/feeds/post';
import { PostDto } from '@/types/feeds/postDto';
import { transformPostDtos } from '@/utils/postTransform';
import { getBlockedUserIdsForUser } from '@/services/users/getBlockedUserIds';

export const getPostsFromJoinedGroups = async (
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

    // 1) Get the list of group IDs the user has joined
    const { data: memberships, error: membershipError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id);

    if (membershipError) {
      throw new Error(
        `Failed to fetch user groups: ${membershipError.message}`
      );
    }

    const groupIds = (memberships || []).map(
      (m: { group_id: number }) => m.group_id
    );
    // If user is not in any groups, return empty feed
    if (groupIds.length === 0) {
      return { posts: [], next_cursor: undefined };
    }

    // 2) Fetch posts from those groups, excluding blocked users
    const blockedIds = await getBlockedUserIdsForUser(user.id);
    const offset = cursor ? parseInt(cursor) : 0;
    let query = supabase
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
				),
				post_image_urls
			`
      )
      .in('group_id', groupIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (blockedIds.length > 0) {
      query = query.not('user_id', 'in', `(${blockedIds.join(',')})`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(
        `Failed to fetch posts from joined groups: ${error.message}`
      );
    }

    // Transform data using helper function
    const transformedPosts: PostData[] = transformPostDtos(
      data as unknown as PostDto[]
    );

    return {
      posts: transformedPosts,
      next_cursor:
        transformedPosts.length === limit ? String(offset + limit) : undefined,
    };
  } catch (error) {
    // Suppress errors from runtime teardown (hot reload, app suspend)
    if (
      error instanceof Error &&
      error.message.includes('Runtime is shutting down')
    ) {
      return { posts: [], next_cursor: undefined };
    }
    console.error('Error fetching posts from joined groups:', error);
    throw error;
  }
};
