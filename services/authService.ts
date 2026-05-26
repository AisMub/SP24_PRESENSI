import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, ENDPOINTS } from '../constants/api';

export type UserRole = 'ADMIN' | 'TEACHER';

export interface AuthUser {
  id: number;
  role: UserRole;
  username: string;
  first_name?: string;
  last_name?: string;
}

interface LoginResult {
  user: AuthUser;
  accessToken: string;
}

export const authService = {
  async login(role: UserRole, username: string, password: string): Promise<LoginResult> {
    const endpoint = role === 'ADMIN' ? ENDPOINTS.LOGIN_ADMIN : ENDPOINTS.LOGIN_TEACHER;

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Login gagal');
    }

    // Admin: data.data = { admin: {...}, accessToken }
    // Teacher: data.data = { teacher: {...}, accessToken }
    const accessToken: string = data.data.accessToken;
    const rawUser = data.data.admin ?? data.data.teacher;

    if (!accessToken || !rawUser) {
      throw new Error('Response tidak valid dari server');
    }

    // Normalize: admin_id / teacher_id → id
    const user: AuthUser = {
      id: rawUser.admin_id ?? rawUser.teacher_id,
      role,
      username: rawUser.username,
      first_name: rawUser.first_name,
      last_name: rawUser.last_name,
    };

    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(user));

    return { user, accessToken };
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('user');
  },

  async getStoredUser(): Promise<AuthUser | null> {
    const raw = await AsyncStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },

  async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem('accessToken');
  },
};
