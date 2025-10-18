import { useQuery } from '@tanstack/react-query';
import { getAllModules, getAllModulesWithSubmodules, getModule, getModuleWithSubmodules } from '../../services/sanity/modules';

export function useSanityModules() {
  return useQuery({
    queryKey: ['sanity', 'modules'],
    queryFn: getAllModulesWithSubmodules,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useSanityModule(moduleId: string) {
  return useQuery({
    queryKey: ['sanity', 'module', moduleId],
    queryFn: () => getModule(moduleId),
    enabled: !!moduleId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useSanityModuleWithSubmodules(moduleId: string) {
  return useQuery({
    queryKey: ['sanity', 'moduleWithSubmodules', moduleId],
    queryFn: () => getModuleWithSubmodules(moduleId),
    enabled: !!moduleId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

