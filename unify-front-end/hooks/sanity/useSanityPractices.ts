import { useQuery } from '@tanstack/react-query';
import {
  getPracticesBySubmodule,
  getPracticeById,
} from '@/services/sanity/practices';

export function useSanityPractices(submoduleId: string) {
  return useQuery({
    queryKey: ['sanity', 'practices', submoduleId],
    queryFn: () => getPracticesBySubmodule(submoduleId),
    enabled: !!submoduleId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useSanityPractice(practiceId: string) {
  return useQuery({
    queryKey: ['sanity', 'practice', practiceId],
    queryFn: () => getPracticeById(practiceId),
    enabled: !!practiceId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
