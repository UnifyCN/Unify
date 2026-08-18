import { useQuery } from '@tanstack/react-query';
import {
  getPracticesBySubmodule,
  getPracticeById,
} from '@/services/sanity/practices';
import { sanityQueryKeys } from './sanityQueryKeys';
import { useSanityLanguage } from './useSanityLanguage';

export function useSanityPractices(submoduleId: string) {
  const language = useSanityLanguage();
  return useQuery({
    queryKey: sanityQueryKeys.practices(submoduleId, language),
    queryFn: () => getPracticesBySubmodule(submoduleId, language),
    enabled: !!submoduleId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useSanityPractice(practiceId: string) {
  const language = useSanityLanguage();
  return useQuery({
    queryKey: sanityQueryKeys.practice(practiceId, language),
    queryFn: () => getPracticeById(practiceId, language),
    enabled: !!practiceId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
