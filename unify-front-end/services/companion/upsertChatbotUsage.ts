/**
 * Client-side usage tracking is now read-only.
 * The server (rag-query edge function) increments message_count atomically via
 * the increment_chatbot_usage RPC. This function is kept as a no-op so existing
 * callers don't break — the query cache is invalidated to pick up the
 * server-side increment.
 */
export const upsertChatbotUsage = async (
  _new_message_count: number
): Promise<boolean> => {
  // No-op: server handles the increment. The useUpdateChatbotUsage hook
  // invalidates the chatbot-usage query on success, which re-fetches
  // the real count from the DB.
  return true;
};
