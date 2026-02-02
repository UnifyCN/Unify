import { supabase } from '@/lib/supabase';
import { Group } from '@/types/groups';

export const searchGroups = async (searchQuery: string): Promise<Group[]> => {
  try {
    if (!searchQuery.trim()) {
      return [];
    }

    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .ilike('group_name', `%${searchQuery}%`)
      .order('member_count', { ascending: false }); // Show most popular groups first

    if (error) {
      throw new Error('Failed to search groups');
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
    console.error('Error searching groups:', error);
    throw error;
  }
};
