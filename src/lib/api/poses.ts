import { ReferencePose } from '@/types/mediapipe';
import { api } from './client';

export const posesApi = {
  getAll: () => api.get<ReferencePose[]>('/api/v1/poses'),
  getById: (id: string) => api.get<ReferencePose>(`/api/v1/poses/${id}`),
  create: (pose: Omit<ReferencePose, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<ReferencePose>('/api/v1/poses', pose),
  update: (id: string, pose: Partial<ReferencePose>) =>
    api.put<ReferencePose>(`/api/v1/poses/${id}`, pose),
  delete: (id: string) => api.delete<{ success: boolean }>(`/api/v1/poses/${id}`),
};
