import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/context/UserContext';

export const useUserReportStatus = (reportedUserId: string) => {
  const { currentUser } = useCurrentUser();

  return useQuery({
    queryKey: ['user-report-status', reportedUserId, currentUser?.id],
    enabled: !!reportedUserId && !!currentUser?.id,
    queryFn: async () => {
      if (!currentUser?.id) return false;

      const { data, error } = await supabase
        .from('user_reports')
        .select('id')
        .eq('reported_id', reportedUserId)
        .eq('reporter_id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.error('Failed to fetch user report status:', error);
        return false;
      }

      return !!data;
    },
  });
};
