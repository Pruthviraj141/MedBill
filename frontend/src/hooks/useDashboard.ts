import { useQuery } from '@tanstack/react-query';
import { dashboardRepository } from '../db/repositories/dashboardRepository';

export function useDashboard(period = 'today') {
  return useQuery({
    queryKey: ['dashboard', period],
    queryFn: async () => {
      const data = await dashboardRepository.getDailyMetrics(period);
      return data;
    },
    staleTime: 30_000, // Keep data fresh for 30 seconds to prevent unnecessary background refetches
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
