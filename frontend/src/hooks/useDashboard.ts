import { useQuery } from '@tanstack/react-query';
import { dashboardRepository } from '../db/repositories/dashboardRepository';

export function useDashboard(period = 'today') {
  return useQuery({
    queryKey: ['dashboard', period],
    queryFn: async () => {
      const data = await dashboardRepository.getDailyMetrics(period);
      return data;
    },
    staleTime: 0,
  });
}
