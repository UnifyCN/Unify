import { supabase } from '@/lib/supabase';

// Check if Supabase is available
export const isGeminiAvailable = () => {
  return !!supabase;
};

interface ConversationMessage {
  message: string;
  role: 'user' | 'assistant';
}

// Function to call the RAG query edge function
export const callGeminiAPI = async (
  prompt: string,
  conversationIdentifier?: string,
  messages?: ConversationMessage[]
) => {
  try {
    const { data, error } = await supabase.functions.invoke('rag-query', {
      body: {
        prompt,
        conversationIdentifier,
        messages: messages || [],
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
