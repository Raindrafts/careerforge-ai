import { apiClient } from './client'
import type { RoadmapRequest, RoadmapResponse, RoadmapProgressUpdate } from '@/types'

export const roadmapApi = {
  generate: (data: RoadmapRequest) =>
    apiClient.post<RoadmapResponse>('/api/roadmap/generate', data),
  getLatest: () =>
    apiClient.get<{ roadmap: RoadmapResponse | null }>('/api/roadmap/latest'),
  updateProgress: (data: RoadmapProgressUpdate) =>
    apiClient.patch('/api/roadmap/progress', data),
}
