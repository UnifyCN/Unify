import { supabase } from '@/lib/supabase';
import { QueryType } from '@/types/chatbot';

export interface SaveMessageParams {
  conversationIdentifier: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: any; // JSONB field
  queryType?: QueryType; // Optional metadata
  disclaimer?: string; // Optional disclaimer text
  suggestedNextSteps?: string[]; // Optional - not persisted to DB, used for UI only
}

export const saveMessage = async ({
  conversationIdentifier,
  role,
  content,
  sources,
  queryType,
  disclaimer,
}: SaveMessageParams): Promise<void> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // First, get the conversation by identifier to get the internal id
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('conversation_identifier', conversationIdentifier)
      .eq('user_id', user.id) // Ensure user owns this conversation
      .single();

    if (convError) {
      throw new Error(`Conversation not found: ${convError.message}`);
    }

    if (!conversation) {
      throw new Error('Conversation not found - no data returned');
    }

    // Insert the message
    // Note: queryType and disclaimer are not stored in DB currently
    // They're included in the response but not persisted
    const { error: messageError } = await supabase.from('messages').insert({
      conversation_id: conversation.id,
      role,
      content,
      sources: sources || null,
    });

    if (messageError) {
      throw messageError;
    }
  } catch (error) {
    console.error('Error in saveMessage:', error);
    throw error;
  }
};
