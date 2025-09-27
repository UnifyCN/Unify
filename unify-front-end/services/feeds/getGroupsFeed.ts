import { supabase } from '@/lib/supabase';
import { FeedResponse } from '@/types/feeds/feedResponse';
import { PostData } from '@/types/feeds/post';
import { User } from '@/types/user';

export const getFeedGroups = async (
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

    console.log(typeof user.id);
    // 1) Get the list of group IDs the user has joined
    const { data: memberships, error: membershipError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id);

    console.log(memberships);
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

    // 2) Fetch posts from those groups
    const offset = cursor ? parseInt(cursor) : 0;
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
      .in('group_id', groupIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch groups feed: ${error.message}`);
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
      title: post.title,
      content: post.content,
      group: post.groups?.group_name || null,
    }));

    return {
      posts: transformedPosts,
      next_cursor:
        transformedPosts.length === limit ? String(offset + limit) : undefined,
    };
  } catch (error) {
    console.error('Error fetching groups feed:', error);
    throw error;
  }
};
