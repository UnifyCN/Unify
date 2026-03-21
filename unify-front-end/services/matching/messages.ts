import { supabase } from '@/lib/supabase';
import type { CommunityMessage } from '@/types/matching';

type SentMessageResult = {
  id: string;
  dedupe_key: string | null;
};

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
        message_type,
        metadata,
        dedupe_key,
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
    data?.map(row => {
      const r = row as any;
      const user = r.users;
      return {
        id: r.id,
        circle_id: r.circle_id,
        sender_user_id: r.sender_user_id,
        content: r.content,
        message_type: r.message_type ?? 'user',
        metadata: r.metadata || null,
        dedupe_key: r.dedupe_key ?? null,
        created_at: r.created_at,
        sender: user
          ? {
              id: user.id,
              username: user.username,
              profile_picture_url: user.profile_picture_url,
            }
          : null,
      };
    }) ?? []
  );
};

export const sendCircleMessage = async (
  circleId: string,
  content: string,
  dedupeKey: string
): Promise<SentMessageResult | null> => {
  const trimmed = content.trim();
  if (!trimmed) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('community_messages')
    .insert({
      circle_id: circleId,
      sender_user_id: user.id,
      content: trimmed,
      message_type: 'user',
      dedupe_key: dedupeKey,
    })
    .select('id,dedupe_key')
    .single();

  if (error) {
    throw new Error(`Failed to send message: ${error.message}`);
  }

  return (data as SentMessageResult | null) ?? null;
};
