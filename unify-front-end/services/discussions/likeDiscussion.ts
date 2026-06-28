import { supabase } from '@/lib/supabase';

export interface LikeDiscussionResponse {
  success: boolean;
  liked: boolean;
  likesCount: number;
}

export const likeDiscussion = async (
  discussionId: string
): Promise<LikeDiscussionResponse> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error: insertError } = await supabase.from('discussion_likes').insert({
    discussion_id: discussionId,
    user_id: user.id,
  });

  if (insertError) {
    console.error('Error liking discussion:', insertError);
    return { success: false, liked: false, likesCount: 0 };
  }

  const { data } = await supabase
    .from('module_discussions')
    .select('like_count')
    .eq('id', discussionId)
    .single();

  return {
    success: true,
    liked: true,
    likesCount: data?.like_count ?? 0,
  };
};

export const unlikeDiscussion = async (
  discussionId: string
): Promise<LikeDiscussionResponse> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  await supabase
    .from('discussion_likes')
    .delete()
    .eq('discussion_id', discussionId)
    .eq('user_id', user.id);

  const { data } = await supabase
    .from('module_discussions')
    .select('like_count')
    .eq('id', discussionId)
    .single();

  return {
    success: true,
    liked: false,
    likesCount: data?.like_count ?? 0,
  };
};

export const likeDiscussionReply = async (
  replyId: string
): Promise<LikeDiscussionResponse> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error: insertError } = await supabase
    .from('discussion_reply_likes')
    .insert({
      reply_id: replyId,
      user_id: user.id,
    });

  if (insertError) {
    console.error('Error liking discussion reply:', insertError);
    return { success: false, liked: false, likesCount: 0 };
  }

  const { data } = await supabase
    .from('discussion_replies')
    .select('like_count')
    .eq('id', replyId)
    .single();

  return {
    success: true,
    liked: true,
    likesCount: data?.like_count ?? 0,
  };
};

export const unlikeDiscussionReply = async (
  replyId: string
): Promise<LikeDiscussionResponse> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  await supabase
    .from('discussion_reply_likes')
    .delete()
    .eq('reply_id', replyId)
    .eq('user_id', user.id);

  const { data } = await supabase
    .from('discussion_replies')
    .select('like_count')
    .eq('id', replyId)
    .single();

  return {
    success: true,
    liked: false,
    likesCount: data?.like_count ?? 0,
  };
};
