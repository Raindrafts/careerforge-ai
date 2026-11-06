import { apiClient } from './client'
import type { DashboardOverview } from '@/types'

export const dashboardApi = {
  getOverview: () => apiClient.get<DashboardOverview>('/api/dashboard/overview'),
}
