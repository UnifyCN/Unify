import { supabase } from '@/lib/supabase';
import { QueryType } from '@/types/chatbot';

export interface ConversationMessage {
  id: number;
  clientId?: string;
  role: 'user' | 'assistant';
  content: string;
  sources: any | null; // JSONB field
  query_type?: QueryType; // Optional - may not exist in DB yet
  disclaimer?: string; // Optional - may not exist in DB yet
  created_at: string;
}

export const getConversationMessages = async (
  conversationIdentifier: string
): Promise<ConversationMessage[]> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // Use a join to fetch messages directly by conversation_identifier
    // Note: query_type and disclaimer columns are optional - only include if they exist in your DB
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(
        `
        id,
        role,
        content,
        sources,
        created_at,
        conversations!inner(conversation_identifier, user_id)
      `
      )
      .eq('conversations.conversation_identifier', conversationIdentifier)
      .eq('conversations.user_id', user.id) // Ensure user owns this conversation
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      throw messagesError;
    }

    return messages || [];
  } catch (error) {
    console.error('Error in getConversationMessages:', error);
    return [];
  }
};
