import { useQuery } from '@tanstack/react-query';
import { getSubmoduleWithLessons } from '../../services/sanity/submodules';
import { sanityQueryKeys } from './sanityQueryKeys';
import { useSanityLanguage } from './useSanityLanguage';

export function useSanitySubmoduleWithLessons(submoduleId: string) {
  const language = useSanityLanguage();
  return useQuery({
    queryKey: sanityQueryKeys.submoduleWithLessons(submoduleId, language),
    queryFn: () => getSubmoduleWithLessons(submoduleId, language),
    enabled: !!submoduleId,
    staleTime: 30 * 60 * 1000, // 30 minutes - lesson structure rarely changes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });
}
