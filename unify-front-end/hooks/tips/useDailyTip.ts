import { useQuery } from '@tanstack/react-query';
import { getDailyTip } from '@/services/tips/getDailyTip';

function getTodayUTC(): string {
  return new Date().toISOString().split('T')[0];
}

export const useDailyTip = (persona?: string, stage?: string) => {
  return useQuery({
    queryKey: ['dailyTip', persona, stage, getTodayUTC()],
    queryFn: () => getDailyTip(persona!, stage!),
    enabled: !!persona && !!stage,
    staleTime: 1000 * 60 * 30, // 30 min — tip doesn't change intraday
    gcTime: 1000 * 60 * 60, // 1 hour
  });
};
