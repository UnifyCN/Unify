import { supabase } from '@/lib/supabase';

export interface SearchUserResult {
  id: string;
  username: string;
  profilePictureUrl: string | null;
}

export const searchUsers = async (
  searchQuery: string
): Promise<SearchUserResult[]> => {
  try {
    if (!searchQuery.trim()) {
      return [];
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, username, profile_picture_url')
      .ilike('username', `%${searchQuery.trim()}%`)
      .limit(20);

    if (error) {
      throw new Error('Failed to search users');
    }

    return (
      data?.map((user) => ({
        id: user.id,
        username: user.username ?? '',
        profilePictureUrl: user.profile_picture_url ?? null,
      })) ?? []
    );
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};
