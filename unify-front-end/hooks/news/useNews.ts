import { getAllNews } from '@/services/news/getAllNews';
import { useQuery } from '@tanstack/react-query';

export const useNews = () => {
  return useQuery({
    queryKey: ['news'],
    queryFn: () => getAllNews(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};
