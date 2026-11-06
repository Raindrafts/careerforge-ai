import { apiClient } from './client'
import type { StudentProfile, StudentProfileCreate } from '@/types'

export const profileApi = {
  getMe: () => apiClient.get<{ profile: StudentProfile | null }>('/api/profile/me'),
  upsert: (data: StudentProfileCreate) => apiClient.post<{ profile: StudentProfile }>('/api/profile/', data),
}
