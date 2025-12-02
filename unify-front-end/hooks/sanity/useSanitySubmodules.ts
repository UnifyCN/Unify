import { useQuery } from '@tanstack/react-query';
import { getSubmoduleWithLessons } from '../../services/sanity/submodules';

export function useSanitySubmoduleWithLessons(submoduleId: string) {
  return useQuery({
    queryKey: ['sanity', 'submoduleWithLessons', submoduleId],
    queryFn: () => getSubmoduleWithLessons(submoduleId),
    enabled: !!submoduleId,
    staleTime: 30 * 60 * 1000, // 30 minutes - lesson structure rarely changes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });
}
