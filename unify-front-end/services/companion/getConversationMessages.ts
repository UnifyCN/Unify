import { supabase } from '@/lib/supabase';

export interface ConversationMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  sources: any | null; // JSONB field
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
