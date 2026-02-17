import { supabase } from '@/lib/supabase';
import { Group } from '@/types/groups';

export const searchGroups = async (searchQuery: string): Promise<Group[]> => {
  try {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = `%${searchQuery.trim()}%`;
    const [nameResult, descriptionResult] = await Promise.all([
      supabase
        .from('groups')
        .select('*')
        .ilike('group_name', query)
        .order('member_count', { ascending: false }),
      supabase
        .from('groups')
        .select('*')
        .ilike('group_description', query)
        .order('member_count', { ascending: false }),
    ]);

    if (nameResult.error || descriptionResult.error) {
      throw new Error('Failed to search groups');
    }

    const mergedGroups = [...(nameResult.data ?? []), ...(descriptionResult.data ?? [])];
    const dedupedGroups = Array.from(
      new Map(mergedGroups.map(group => [group.id, group])).values()
    ).sort((a, b) => (b.member_count ?? 0) - (a.member_count ?? 0));

    // Map the database columns to the Group interface
    return (
      dedupedGroups.map(group => ({
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
