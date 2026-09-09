import { useQuery } from '@tanstack/react-query';
import { getDailyReport } from '../api/reports';

export function useDashboard(period = 'today') {
  return useQuery({
    queryKey: ['dashboard', period],
    queryFn: () => getDailyReport(period),
    staleTime: 60 * 1000,
  });
}
