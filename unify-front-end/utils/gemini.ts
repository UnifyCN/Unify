import { supabase } from '@/lib/supabase';

// Check if Supabase is available
export const isGeminiAvailable = () => {
  return !!supabase;
};

// Function to call the RAG query edge function
export const callGeminiAPI = async (prompt: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('rag-query', {
      body: { prompt },
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
