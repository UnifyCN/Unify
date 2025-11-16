import { supabase } from '@/lib/supabase';

export interface Conversation {
  conversation_identifier: string;
  title: string | null;
  updated_at: string;
}

export const getConversations = async (): Promise<Conversation[]> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('conversations')
      .select('conversation_identifier, title, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getConversations:', error);
    return [];
  }
};
