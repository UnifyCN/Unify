import { supabase } from '@/lib/supabase';
import { Group } from '@/types/groups';

export const getUserJoinedGroups = async (): Promise<Group[]> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
  
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          groups!inner (
            id,
            group_name,
            group_description,
            member_count,
            cover_photo_url,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });
  
      if (error) {
        throw new Error('Failed to fetch joined groups');
      }
  
      // The data structure will be different with the inner join
      return (
        data?.map((membership: any) => ({
          id: membership.groups.id,
          name: membership.groups.group_name,
          description: membership.groups.group_description,
          memberCount: membership.groups.member_count,
          coverPhotoUrl: membership.groups.cover_photo_url,
          createdAt: membership.groups.created_at,
        })) || []
      );
    } catch (error) {
      console.error('Error fetching joined groups:', error);
      throw error;
    }
  };