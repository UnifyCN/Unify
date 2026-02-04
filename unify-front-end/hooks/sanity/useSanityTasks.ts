import { useQuery } from '@tanstack/react-query';
import { getTasksBySubmodule, getTaskById } from '@/services/sanity/tasks';

export function useSanityTasks(submoduleId: string) {
  return useQuery({
    queryKey: ['sanity', 'tasks', submoduleId],
    queryFn: () => getTasksBySubmodule(submoduleId),
    enabled: !!submoduleId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useSanityTask(taskId: string) {
  return useQuery({
    queryKey: ['sanity', 'task', taskId],
    queryFn: () => getTaskById(taskId),
    enabled: !!taskId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
