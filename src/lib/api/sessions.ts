import { EvaluationSession } from '@/types/mediapipe';
import { api } from './client';

export const sessionsApi = {
  getAll: () => api.get<EvaluationSession[]>('/api/v1/sessions'),
  getById: (id: string) => api.get<EvaluationSession>(`/api/v1/sessions/${id}`),
  create: (session: Omit<EvaluationSession, 'id'>) =>
    api.post<EvaluationSession>('/api/v1/sessions', session),
  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/api/v1/sessions/${id}`),
};
