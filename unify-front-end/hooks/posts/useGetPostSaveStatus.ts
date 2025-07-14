import { useQuery } from '@tanstack/react-query';
import { getPostSaveStatus } from '@/services/posts/getPostSaveStatus';

export const useGetPostSaveStatus = (postId: number) => {
  return useQuery({
    queryKey: ['post-save-status', postId],
    queryFn: () => getPostSaveStatus(postId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}; 