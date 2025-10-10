import { supabase } from '@/lib/supabase';
import { FeedResponse } from '@/types/feeds/feedResponse';
import { PostData } from '@/types/feeds/post';
import { User } from '@/types/user';

export const getPostsByGroup = async (
  groupId: number | string,
  cursor?: string,
  limit = 20
): Promise<FeedResponse> => {
  try {
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
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Failed to fetch group posts: ${error.message}`);

    const transformed: PostData[] = (data || []).map((post: any) => ({
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
      posts: transformed,
      next_cursor:
        transformed.length === limit ? String(offset + limit) : undefined,
    };
  } catch (err) {
    console.error('getPostsByGroup error', err);
    throw err;
  }
};
