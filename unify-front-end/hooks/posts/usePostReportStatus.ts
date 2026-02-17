import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/context/UserContext';

export const usePostReportStatus = (postId: number) => {
  const { currentUser } = useCurrentUser();

  return useQuery({
    queryKey: ['post-report-status', postId, currentUser?.id],
    enabled: !!postId && !!currentUser?.id,
    queryFn: async () => {
      if (!currentUser?.id) return false;

      const { data, error } = await supabase
        .from('post_report')
        .select('id')
        .eq('post_id', postId)
        .eq('reporter_id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.error('Failed to fetch post report status:', error);
        return false;
      }

      return !!data;
    },
  });
};
