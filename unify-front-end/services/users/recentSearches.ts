import { supabase } from '@/lib/supabase';


export const saveRecentSearch = async (userId: string, searchQuery: string) => {
  // Call 1: Upsert the new search
  const { data: upsertData, error: upsertError } = await supabase
    .from('user_recent_searches')
    .upsert({
      user_id: userId,
      search_query: searchQuery,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,search_query' }
  );

  if (upsertError) return { error: upsertError };

  return { data: upsertData, error: null };
};

export async function getRecentSearches(userId: string) {
  const { data, error } = await supabase
    .from('user_recent_searches')
    .select('search_query')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(3);
  return { searches: data?.map(row => row.search_query) ?? [], error };
}