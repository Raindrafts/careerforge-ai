import { apiClient } from './client'
import type { SkillGapRequest, SkillGapResponse } from '@/types'

export const skillGapApi = {
  getRoles: () => apiClient.get<{ roles: string[] }>('/api/skill-gap/roles'),
  analyze: (data: SkillGapRequest) =>
    apiClient.post<SkillGapResponse>('/api/skill-gap/analyze', data),
  getLatest: () =>
    apiClient.get<{ analysis: SkillGapResponse | null }>('/api/skill-gap/latest'),
}
