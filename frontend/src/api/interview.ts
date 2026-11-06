import { apiClient } from './client'
import type {
  InterviewStartRequest,
  InterviewSession,
  AnswerSubmitRequest,
  AnswerFeedbackResponse,
} from '@/types'

export const interviewApi = {
  start: (data: InterviewStartRequest) =>
    apiClient.post<InterviewSession>('/api/interview/start', data),
  submitAnswer: (data: AnswerSubmitRequest) =>
    apiClient.post<AnswerFeedbackResponse>('/api/interview/submit', data),
  getSessions: () =>
    apiClient.get<{ sessions: InterviewSession[] }>('/api/interview/sessions'),
  getSession: (id: string) =>
    apiClient.get<{ session: InterviewSession }>(`/api/interview/${id}`),
}
