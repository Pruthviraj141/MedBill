import { apiClient } from './client';
import type { DailyReport } from '../types';

export const getDailyReport = (period = 'today') => apiClient.get<DailyReport>(`/api/reports/${period}`);
