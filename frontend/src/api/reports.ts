import { apiClient } from './client'

export const reportsApi = {
  downloadCareerProfilePdf: () =>
    apiClient.post('/api/reports/career-profile/pdf', {}, { responseType: 'blob' }),
  downloadSkillGapPdf: () =>
    apiClient.post('/api/reports/skill-gap/pdf', {}, { responseType: 'blob' }),
  downloadRoadmapPdf: () =>
    apiClient.post('/api/reports/roadmap/pdf', {}, { responseType: 'blob' }),
  getHistory: () =>
    apiClient.get<{ reports: any[] }>('/api/reports/'),
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
