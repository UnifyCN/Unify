import { supabase } from '@/lib/supabase';
import { DiscussionReplyData } from '@/types/learn/moduleDiscussion';

export const getDiscussionReplies = async (
  discussionId: string
): Promise<DiscussionReplyData[]> => {
  const { data, error } = await supabase
    .from('discussion_replies')
    .select(
      `
        id,
        discussion_id,
        author_id,
        body,
        like_count,
        created_at,
        users!author_id (id, username, profile_picture_url)
      `
    )
    .eq('discussion_id', discussionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching discussion replies:', error);
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    discussion_id: row.discussion_id,
    author_id: row.author_id,
    body: row.body,
    like_count: row.like_count,
    created_at: row.created_at,
    username: row.users?.username ?? '',
    profilePictureUrl: row.users?.profile_picture_url ?? undefined,
  }));
};
