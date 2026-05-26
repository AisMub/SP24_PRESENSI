import { api } from './api';
import { ENDPOINTS } from '../constants/api';

export interface Presence {
  presence_id: number;
  enter: string;
  exit: string | null;
  student: {
    first_name: string;
    last_name: string;
    nis: string;
    class: string;
  };
  teacher?: {
    first_name: string;
    last_name: string;
  };
}

export const presenceService = {
  getAll: (): Promise<Presence[]> =>
    api.get(ENDPOINTS.PRESENCES).then(d => d.data ?? d),

  tap: (tag_id: string, teacher_id: number) =>
    api.post(ENDPOINTS.TAP, { tag_id, teacher_id }),

  parentPortal: (nis: string) =>
    api.get(ENDPOINTS.PARENT_PORTAL(nis)).then(d => d.data ?? d),
};
