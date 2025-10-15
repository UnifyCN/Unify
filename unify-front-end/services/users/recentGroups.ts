import { supabase } from '@/lib/supabase';

export const saveRecentGroups = async (userId: string, groupId: number) => {
  // Call 1: Upsert the new search
  const { data: upsertData, error: upsertError } = await supabase
    .from('user_recent_groups')
    .upsert(
      {
        user_id: userId,
        group_id: groupId,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,group_id' }
    );

  if (upsertError) return { error: upsertError };
};

export async function getRecentGroups(userId: string) {
  const { data, error } = await supabase
    .from('user_recent_groups')
    .select('group_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(3);
  return { groups: data?.map(row => row.group_id) ?? [], error };
}
