import { useQuery } from '@tanstack/react-query';
import {
  getSubmodule,
  getSubmoduleWithLessons,
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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
