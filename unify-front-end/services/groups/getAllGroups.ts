import { supabase } from '@/lib/supabase';
import { Group } from '@/types/groups';

export const getAllGroups = async (): Promise<Group[]> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch groups');
    }

    // Map the database columns to the Group interface
    return data?.map(group => ({
      id: group.id,
      name: group.group_name,
      description: group.group_description,
      memberCount: group.member_count,
      coverPhotoUrl: group.cover_photo_url,
      createdAt: group.created_at,
    })) || [];
  } catch (error) {
    console.error('Error fetching groups:', error);
    throw error;
  }
};
