import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/context/UserContext';

export const useUserBlockStatus = (blockedUserId: string) => {
  const { currentUser } = useCurrentUser();

  return useQuery({
    queryKey: ['user-block-status', blockedUserId, currentUser?.id],
    enabled: !!blockedUserId && !!currentUser?.id,
    queryFn: async () => {
      if (!currentUser?.id) return false;

      const { data, error } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', currentUser.id)
        .eq('blocked_id', blockedUserId)
        .maybeSingle();

      if (error) {
        console.error('Failed to fetch block status:', error);
        return false;
      }

      return !!data;
    },
  });
};
