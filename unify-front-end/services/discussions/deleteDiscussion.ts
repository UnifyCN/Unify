import { supabase } from '@/lib/supabase';

export interface DeleteDiscussionResponse {
  success: boolean;
}

export const deleteDiscussion = async (
  discussionId: string
): Promise<DeleteDiscussionResponse> => {
  const { error } = await supabase
    .from('module_discussions')
    .delete()
    .eq('id', discussionId);

  if (error) {
    console.error('Error deleting discussion:', error);
    throw new Error(error.message);
  }

  return { success: true };
};

export const deleteDiscussionReply = async (
  replyId: string
): Promise<DeleteDiscussionResponse> => {
  const { error } = await supabase
    .from('discussion_replies')
    .delete()
    .eq('id', replyId);

  if (error) {
    console.error('Error deleting discussion reply:', error);
    throw new Error(error.message);
  }

  return { success: true };
};
