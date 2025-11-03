import { useQuery } from '@tanstack/react-query';
import {
  getSubmodule,
  getSubmoduleWithLessons,
  getSubmoduleWithLessonMetadata,
} from '../../services/sanity/submodules';

export function useSanitySubmodule(submoduleId: string) {
  return useQuery({
    queryKey: ['sanity', 'submodule', submoduleId],
    queryFn: () => getSubmodule(submoduleId),
    enabled: !!submoduleId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

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

export function useSanitySubmoduleWithLessonMetadata(submoduleId: string) {
  return useQuery({
    queryKey: ['sanity', 'submoduleWithLessonMetadata', submoduleId],
    queryFn: () => getSubmoduleWithLessonMetadata(submoduleId),
    enabled: !!submoduleId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
