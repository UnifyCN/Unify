/**
 * Client-side usage tracking is now read-only.
 * The server (rag-query edge function) owns message_count: it increments
 * atomically via the check_and_increment_chatbot_usage RPC (the rate-limit
 * gate) and refunds via refund_chatbot_message when generation fails.
 * increment_chatbot_usage only accumulates tokens + cost. This function is kept
 * as a no-op so existing callers don't break — the query cache is invalidated
 * to pick up the server-side count.
 */
export const upsertChatbotUsage = async (
  _new_message_count: number
): Promise<boolean> => {
  // No-op: server handles the increment. The useUpdateChatbotUsage hook
  // invalidates the chatbot-usage query on success, which re-fetches
  // the real count from the DB.
  return true;
};
