import { api } from './api';
import { ENDPOINTS } from '../constants/api';

export interface Student {
  id: number;
  nis: string;
  first_name: string;
  last_name: string;
  class: string;
  parent: string;
  tag_id: string;
  age: number;
}

export const studentService = {
  getAll: (): Promise<Student[]> => api.get(ENDPOINTS.STUDENTS).then(d => d.data ?? d),
  getById: (id: number): Promise<Student> => api.get(ENDPOINTS.STUDENT(id)).then(d => d.data ?? d),
  create: (body: Omit<Student, 'id'>) => api.post(ENDPOINTS.STUDENTS, body),
  update: (id: number, body: Partial<Student>) => api.put(ENDPOINTS.STUDENT(id), body),
  delete: (id: number) => api.delete(ENDPOINTS.STUDENT(id)),
  getPhotoUrl: (id: number) => `${ENDPOINTS.STUDENT_PHOTO(id)}`,
};
