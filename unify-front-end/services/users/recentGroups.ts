import { supabase } from '@/lib/supabase';
import { Group } from '@/types/groups';

export const saveRecentGroups = async (userId: string, groupId: number) => {
  const { error } = await supabase.from('user_recent_groups').upsert(
    {
      user_id: userId,
      group_id: groupId,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,group_id' }
  );

  if (error) return { error };
  return { error: null };
};

export async function getRecentGroupsWithData(userId: string) {
  const { data, error } = await supabase
    .from('user_recent_groups')
    .select(
      `
      group_id,
      groups!group_id(
        id,
        group_name,
        group_description,
        member_count,
        cover_photo_url,
        created_at
      )
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    return { groups: [], error };
  }

  // Transform the data to match Group interface
  const groups: Group[] = (data || [])
    .filter((row: any) => row.groups)
    .map((row: any) => ({
      id: row.groups.id,
      name: row.groups.group_name?.trim() ?? '',
      description: row.groups.group_description?.trim() ?? null,
      memberCount: row.groups.member_count,
      coverPhotoUrl: row.groups.cover_photo_url,
      createdAt: row.groups.created_at,
    }));

  return { groups, error: null };
}
