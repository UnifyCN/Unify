import { supabase } from '@/lib/supabase';
import { createPostLikeNotification } from '@/services/notifications/createPostLikeNotification';

export interface ReportPostResponse {
  success: boolean;
  reported: boolean;
  reportCount: number;
}

export const reportPost = async (postId: number, reason: string): Promise<ReportPostResponse> => {
    const trimmed = (reason || '').trim().slice(0, 500);
    if (!trimmed || trimmed.length < 5) throw new Error('Please provide a short reason (min 5 chars).');

    try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Like the post (add the like)
    await supabase.from('reports').insert({
      post_id: postId,
      user_id: user.id,
      reason: trimmed,
      status: 'pending'
    });

    const { data: postData } = await supabase
        .from('posts')
        .select('report_count')//create column -> done
        .eq('id', postId)
        .single();

    return {
      success: true,
      reported: true,
      reportCount: postData?.report_count || 0,
    };
  } catch (error) {
    console.error('Error liking post:', error);
    throw new Error('Failed to like post');
  }
};

export const unreportPost = async (postId: number): Promise<ReportPostResponse> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    await supabase
      .from('post_reports')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);

    const { data: postData } = await supabase
      .from('posts')
      .select('report_count')
      .eq('id', postId)
      .single();

    return {
      success: true,
      reported: false,
      reportCount: postData?.report_count || 0,
    };
  } catch (error) {
    console.error('Error unreporting post:', error);
    throw new Error('Failed to unreport post');
  }
};