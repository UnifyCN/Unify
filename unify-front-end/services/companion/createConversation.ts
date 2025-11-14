import { supabase } from '@/lib/supabase';

export interface CreateConversationResponse {
  conversation_identifier: string;
  id: number;
}

export interface CreateConversationParams {
  firstMessage?: string;
}

const generateTitle = async (firstMessage: string): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-title', {
      body: {
        message: firstMessage,
      },
    });

    if (error || !data || !data.title) {
      // Fallback to truncated message
      return firstMessage.length > 50
        ? firstMessage.substring(0, 50) + '...'
        : firstMessage;
    }

    return data.title.trim();
  } catch (error) {
    console.error('Error generating title:', error);
    // Fallback to truncated message
    return firstMessage.length > 50
      ? firstMessage.substring(0, 50) + '...'
      : firstMessage;
  }
};

export const createConversation = async (
  params?: CreateConversationParams
): Promise<CreateConversationResponse> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // Generate title from first message if provided
    let title = 'New Conversation';
    if (params?.firstMessage && params.firstMessage.trim()) {
      try {
        title = await generateTitle(params.firstMessage.trim());
      } catch (error) {
        console.error('Failed to generate title, using default:', error);
      }
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title,
        // conversation_identifier and timestamps are auto-generated
      })
      .select('conversation_identifier, id')
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }

    if (!data) {
      throw new Error('No data returned from conversation creation');
    }

    return {
      conversation_identifier: data.conversation_identifier,
      id: data.id,
    };
  } catch (error) {
    console.error('Error in createConversation:', error);
    throw error;
  }
};
