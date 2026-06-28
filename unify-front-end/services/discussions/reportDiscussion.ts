import { supabase } from '@/lib/supabase';

export interface ReportDiscussionResponse {
  success: boolean;
  error?: string;
}

export const reportDiscussion = async (
  discussionId: string,
  reason: string
): Promise<ReportDiscussionResponse> => {
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

  const { data, error } = await supabase.functions.invoke('report-discussion', {
    body: { discussionId, reason: trimmed },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    console.error('Error reporting discussion:', error);
    throw new Error(`Failed to report discussion: ${error.message}`);
  }

  return data as ReportDiscussionResponse;
};

export const reportDiscussionReply = async (
  replyId: string,
  reason: string
): Promise<ReportDiscussionResponse> => {
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

  const { data, error } = await supabase.functions.invoke('report-discussion', {
    body: { replyId, reason: trimmed },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    console.error('Error reporting discussion reply:', error);
    throw new Error(`Failed to report reply: ${error.message}`);
  }

  return data as ReportDiscussionResponse;
};
