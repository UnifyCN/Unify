import { supabase } from '@/lib/supabase';

interface ConversationMessage {
  message: string;
  role: 'user' | 'assistant';
}

// Function to call the RAG query edge function
export const callGeminiAPI = async (
  prompt: string,
  conversationIdentifier?: string,
  messages?: ConversationMessage[],
  userId?: string
) => {
  try {
    const { data, error } = await supabase.functions.invoke('rag-query', {
      body: {
        prompt,
        conversationIdentifier,
        messages: messages || [],
        userId,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('No data received from RAG API');
    }

    return data;
  } catch (error) {
    throw error;
  }
};
