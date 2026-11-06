import { apiClient } from './client'
import type { CareerProfileResponse, CareerProfileRequest } from '@/types'

export const careerApi = {
  generate: (data: CareerProfileRequest) =>
    apiClient.post<CareerProfileResponse>('/api/career/generate', data),
  getLatest: () =>
    apiClient.get<{ career_profile: CareerProfileResponse | null }>('/api/career/latest'),
  getHistory: () =>
    apiClient.get<{ history: CareerProfileResponse[] }>('/api/career/history'),
}
