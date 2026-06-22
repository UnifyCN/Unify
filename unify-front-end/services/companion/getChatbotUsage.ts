import { supabase } from '@/lib/supabase';
import { ChatbotUsage } from '@/types/chatbot';

const EMPTY_USAGE: ChatbotUsage = {
  message_count: 0,
  last_message_at: null,
};

export const getChatbotUsage = async (): Promise<ChatbotUsage> => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  // A real auth failure (network / token refresh) must propagate so React Query
  // keeps the last known count and retries — not be masked as "no user → 0",
  // which would re-open the daily-limit gate (same reasoning as the query below).
  if (authError) throw authError;
  // Not signed in → no usage to report (Companion isn't usable anyway).
  if (!user) return EMPTY_USAGE;

  const { data, error } = await supabase
    .from('chatbot_usage')
    .select('user_id, message_count, last_message_at')
    .eq('user_id', user.id)
    .maybeSingle();

  // A real query failure (network / RLS / transient) must NOT be masked as a
  // fresh count of 0 — that silently re-opens the daily-limit gate. Throw so
  // React Query keeps the last known count and retries, instead of resetting
  // the UI to "0 used". `.maybeSingle()` returns data=null (no error) when the
  // user simply has no row yet, so this only fires on genuine failures.
  if (error) throw error;

  // No usage row yet → genuine zero for a brand-new user.
  if (!data) return EMPTY_USAGE;

  // New-day reset (UTC): the server resets message_count on the next increment;
  // we mirror that here for display so the UI doesn't show yesterday's count.
  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  if (data.last_message_at) {
    const lastMessageDate = data.last_message_at.split('T')[0];
    if (lastMessageDate !== currentDate) {
      return {
        message_count: 0,
        last_message_at: data.last_message_at,
      };
    }
  }

  // Same day - return actual count
  return {
    message_count: data.message_count ?? 0,
    last_message_at: data.last_message_at ?? null,
  };
};
