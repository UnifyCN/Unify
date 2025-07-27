import { supabase } from '../../lib/supabase';
import { UpsertChatbotUsageParams } from '../../types/chatbot';

export const upsertChatbotUsage = async (
  params: UpsertChatbotUsageParams
): Promise<boolean> => {
  try {
    const { new_message_count } = params;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { error } = await supabase.from('chatbot_usage').upsert(
      {
        user_id: user.id,
        message_count: new_message_count,
        last_message_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

    if (error) {
      console.error('Error upserting chatbot usage:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in upsertChatbotUsage:', error);
    return false;
  }
};
