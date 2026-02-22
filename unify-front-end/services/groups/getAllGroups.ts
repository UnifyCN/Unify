import { supabase, getAuthUserId } from '@/lib/supabase';
import { Group } from '@/types/groups';

export const getAllGroups = async (): Promise<Group[]> => {
  try {
    await getAuthUserId();

    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch groups');
    }

    // Map the database columns to the Group interface
    return (
      data?.map(group => ({
        id: group.id,
        name: group.group_name?.trim() ?? '',
        description: group.group_description?.trim() ?? null,
        memberCount: group.member_count,
        coverPhotoUrl: group.cover_photo_url,
        createdAt: group.created_at,
      })) || []
    );
  } catch (error) {
    console.error('Error fetching groups:', error);
    throw error;
  }
};
