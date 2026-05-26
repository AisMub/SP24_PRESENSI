import { api } from './api';
import { ENDPOINTS } from '../constants/api';

export interface Teacher {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  gender: string;
  age: number;
}

export const teacherService = {
  getAll: (): Promise<Teacher[]> => api.get(ENDPOINTS.TEACHERS).then(d => d.data ?? d),
  getById: (id: number): Promise<Teacher> => api.get(ENDPOINTS.TEACHER(id)).then(d => d.data ?? d),
  create: (body: Omit<Teacher, 'id'> & { password: string }) => api.post(ENDPOINTS.TEACHERS, body),
  update: (id: number, body: Partial<Teacher>) => api.put(ENDPOINTS.TEACHER(id), body),
  delete: (id: number) => api.delete(ENDPOINTS.TEACHER(id)),
  getPhotoUrl: (id: number) => `${ENDPOINTS.TEACHER_PHOTO(id)}`,
};
