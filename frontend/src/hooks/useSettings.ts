import { useQuery } from '@tanstack/react-query';
import { settingsRepository } from '../db/repositories/settingsRepository';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async (): Promise<Record<string, string>> => {
      return await settingsRepository.getAllSettings();
    },
  });
}

