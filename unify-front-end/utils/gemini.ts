import { supabase } from '@/lib/supabase';

// Check if Supabase is available
export const isGeminiAvailable = () => {
  return !!supabase;
};

// Function to call the Gemini proxy edge function
export const callGeminiAPI = async (prompt: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
      body: { prompt },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('No data received from Gemini API');
    }

    return data;
  } catch (error) {
    throw error;
  }
};
