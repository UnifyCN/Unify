import { useQuery } from '@tanstack/react-query';
import { getTasksBySubmodule, getTaskById } from '@/services/sanity/tasks';
import { sanityQueryKeys } from './sanityQueryKeys';
import { useSanityLanguage } from './useSanityLanguage';

export function useSanityTasks(submoduleId: string) {
  const language = useSanityLanguage();
  return useQuery({
    queryKey: sanityQueryKeys.tasks(submoduleId, language),
    queryFn: () => getTasksBySubmodule(submoduleId, language),
    enabled: !!submoduleId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useSanityTask(taskId: string) {
  const language = useSanityLanguage();
  return useQuery({
    queryKey: sanityQueryKeys.task(taskId, language),
    queryFn: () => getTaskById(taskId, language),
    enabled: !!taskId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
