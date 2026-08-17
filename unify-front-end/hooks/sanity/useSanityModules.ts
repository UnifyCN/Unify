import { useQuery } from '@tanstack/react-query';
import {
  getAllModules,
  getAllModulesWithSubmodules,
  getModule,
  getModuleWithSubmodules,
} from '../../services/sanity/modules';
import { sanityQueryKeys } from './sanityQueryKeys';
import { useSanityLanguage } from './useSanityLanguage';

export function useSanityModules() {
  const language = useSanityLanguage();
  return useQuery({
    queryKey: sanityQueryKeys.modules(language),
    queryFn: () => getAllModulesWithSubmodules(language),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useSanityModule(moduleId: string) {
  const language = useSanityLanguage();
  return useQuery({
    queryKey: sanityQueryKeys.module(moduleId, language),
    queryFn: () => getModule(moduleId, language),
    enabled: !!moduleId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useSanityModuleWithSubmodules(moduleId: string) {
  const language = useSanityLanguage();
  return useQuery({
    queryKey: sanityQueryKeys.moduleWithSubmodules(moduleId, language),
    queryFn: () => getModuleWithSubmodules(moduleId, language),
    enabled: !!moduleId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
