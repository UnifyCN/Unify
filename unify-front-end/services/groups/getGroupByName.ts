import { supabase } from '@/lib/supabase';
import { Group } from '@/types/groups';

export const getGroupByName = async (
  groupName: string
): Promise<Group | null> => {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('group_name', groupName)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to fetch group: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.group_name,
      description: data.group_description,
      memberCount: data.member_count,
      coverPhotoUrl: data.cover_photo_url,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Error fetching group by name:', error);
    throw error;
  }
};
