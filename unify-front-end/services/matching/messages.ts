import { supabase } from '@/lib/supabase';
import type { CommunityMessage } from '@/types/matching';

export const fetchCircleMessages = async (
  circleId: string
): Promise<CommunityMessage[]> => {
  const { data, error } = await supabase
    .from('community_messages')
    .select(
      `
        id,
        circle_id,
        sender_user_id,
        content,
        created_at,
        users:users!left(
          id,
          username,
          profile_picture_url
        )
      `
    )
    .eq('circle_id', circleId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to load messages: ${error.message}`);
  }

  return (
    data?.map(row => ({
      id: row.id,
      circle_id: row.circle_id,
      sender_user_id: row.sender_user_id,
      content: row.content,
      created_at: row.created_at,
      sender: row.users
        ? {
            id: row.users.id,
            username: row.users.username,
            profile_picture_url: row.users.profile_picture_url,
          }
        : null,
    })) ?? []
  );
};

export const sendCircleMessage = async (
  circleId: string,
  content: string
) => {
  const trimmed = content.trim();
  if (!trimmed) {
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase.from('community_messages').insert({
    circle_id: circleId,
    sender_user_id: user.id,
    content: trimmed,
  });

  if (error) {
    throw new Error(`Failed to send message: ${error.message}`);
  }
};
