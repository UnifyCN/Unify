import { supabase } from '@/lib/supabase';
import { Group } from '@/types/groups';

export const getAvailableGroups = async (): Promise<Group[]> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('calling getAvailableGroups');
    // First, get all the group IDs the user is already a member of
    const { data: membershipData, error: membershipError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id);

    if (membershipError) {
      console.error('getAvailableGroups membership error', membershipError);
      throw new Error('Failed to fetch user memberships');
    }

    const joinedGroupIds = membershipData?.map(m => m.group_id) || [];

    // Get all groups
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getAvailableGroups supabase error', error);
      throw new Error('Failed to fetch available groups');
    }

    // Filter out groups the user is already in
    const availableGroups =
      data?.filter(group => !joinedGroupIds.includes(group.id)) || [];

    // Map the database columns to the Group interface
    return availableGroups.map(group => ({
      id: group.id,
      name: group.group_name?.trim() ?? '',
      description: group.group_description?.trim() ?? null,
      memberCount: group.member_count,
      coverPhotoUrl: group.cover_photo_url,
      createdAt: group.created_at,
    }));
  } catch (error) {
    console.error('Error fetching available groups:', error);
    throw error;
  }
};
