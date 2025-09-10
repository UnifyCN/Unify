import { supabase } from '../../lib/supabase';
import { ChatbotUsage } from '../../types/chatbot';

export const getChatbotUsage = async (): Promise<ChatbotUsage> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data } = await supabase
      .from('chatbot_usage')
      .select('user_id, message_count, last_message_at')
      .eq('user_id', user.id)
      .single();

    // If no record exists, return default values
    if (!data) {
      return {
        message_count: 0,
        last_message_at: null,
      };
    }

    // Check if it's a new day and reset count if needed
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format

    if (data.last_message_at) {
      const lastMessageDate = data.last_message_at.split('T')[0];

      if (lastMessageDate !== currentDate) {
        // New day - reset count to 0
        return {
          message_count: 0,
          last_message_at: data.last_message_at,
        };
      }
    }

    // Same day or no previous message - return actual count
    return {
      message_count: data.message_count ?? 0,
      last_message_at: data.last_message_at ?? null,
    };
  } catch (error) {
    return {
      message_count: 0,
      last_message_at: null,
    };
  }
};
