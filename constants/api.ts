export const API_BASE_URL = 'https://sp24api.wind.my.id';
export const SOCKET_URL = 'https://sp24api.wind.my.id';

export const ENDPOINTS = {
  LOGIN_ADMIN: '/api/auth/admin/login',
  LOGIN_TEACHER: '/api/auth/teacher/login',
  REFRESH_TOKEN: '/api/auth/refresh-token',

  TEACHERS: '/api/teachers',
  TEACHER: (id: number) => `/api/teachers/${id}`,
  TEACHER_PHOTO: (id: number) => `/api/teachers/${id}/photo`,

  STUDENTS: '/api/students',
  STUDENT: (id: number) => `/api/students/${id}`,
  STUDENT_PHOTO: (id: number) => `/api/students/${id}/photo`,

  PRESENCES: '/api/presences',
  TAP: '/api/presences/tap',
  PARENT_PORTAL: (nis: string) => `/api/presences/parent/${nis}`,
};
