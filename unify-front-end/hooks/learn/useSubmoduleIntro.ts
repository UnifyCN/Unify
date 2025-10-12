import { useQuery } from '@tanstack/react-query';
import { getSubmoduleIntro, getSubmoduleIntroPages } from '@/services/learn/getSubmoduleIntro';

export const useSubmoduleIntro = (submoduleId: string, pageNum: number = 1) => {
  return useQuery({
    queryKey: ['submoduleIntro', submoduleId, pageNum],
    queryFn: () => getSubmoduleIntro(submoduleId, pageNum),
    enabled: !!submoduleId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useSubmoduleIntroPages = (submoduleId: string) => {
  return useQuery({
    queryKey: ['submoduleIntroPages', submoduleId],
    queryFn: () => getSubmoduleIntroPages(submoduleId),
    enabled: !!submoduleId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
