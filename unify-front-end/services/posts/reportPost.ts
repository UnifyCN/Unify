import { supabase } from '@/lib/supabase';
export interface ReportPostResponse {
  success: boolean;
}

export const reportPost = async (
  postId: number,
  reason: string
): Promise<ReportPostResponse> => {
  const trimmed = (reason || '').trim().slice(0, 500);

  if (!trimmed || trimmed.length < 5) {
    throw new Error('Please provide a short reason.');
  }

  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session) {
    console.error('User not authenticated:', authError);
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase.functions.invoke('report-post', {
    body: { postId, reason: trimmed },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    console.error('Error reporting post:', error);
    throw new Error(`Failed to report post: ${error.message}`);
  }

  return data as ReportPostResponse;
};
