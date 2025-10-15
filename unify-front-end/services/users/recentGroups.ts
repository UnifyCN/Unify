import { supabase } from '@/lib/supabase';

export const saveRecentGroups = async (userId: string, groupId: number) => {
  // Call 1: Upsert the new search
  const { data: upsertData, error: upsertError } = await supabase
    .from('user_recent_groups')
    .upsert({
      user_id: userId,
      group_id: groupId,
      created_at: new Date().toISOString(),
    });

  if (upsertError) return { error: upsertError };

  // Call 2: Delete old searches using a single query with subquery
  const { error: deleteError } = await supabase
    .from('user_recent_groups')
    .delete()
    .eq('user_id', userId)
    .not(
      'id',
      'in',
      `(
      SELECT id FROM user_recent_groups 
      WHERE user_id = '${userId}' 
      ORDER BY created_at DESC 
      LIMIT 3
    )`
    );

  return { data: upsertData, error: deleteError };
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
