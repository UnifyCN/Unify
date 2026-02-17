import { supabase } from '@/lib/supabase';

export interface ReportUserResponse {
  success: boolean;
}

export const reportUser = async (
  userId: string,
  reason: string
): Promise<ReportUserResponse> => {
  const trimmed = (reason || '').trim().slice(0, 500);

  if (!trimmed || trimmed.length < 5) {
    throw new Error('Please provide a short reason (min 5 characters).');
  }

  // Get the logged-in user session
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session) {
    console.error('User not authenticated:', authError);
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase.functions.invoke('report-user', {
    body: { userId, reason: trimmed },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    console.error('Error reporting user:', error);
    throw new Error(`Failed to report user: ${error.message}`);
  }

  return data as ReportUserResponse;
};
