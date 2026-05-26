import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, ENDPOINTS } from '../constants/api';

const request = async (
  path: string,
  options: RequestInit = {},
  withAuth = true,
): Promise<any> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (withAuth) {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && withAuth) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const newToken = await AsyncStorage.getItem('accessToken');
      headers['Authorization'] = `Bearer ${newToken}`;
      const retry = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
      return retry.json();
    }
    throw new Error('SESSION_EXPIRED');
  }

  return res.json();
};

const tryRefreshToken = async (): Promise<boolean> => {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.REFRESH_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await res.json();
    if (data.accessToken) {
      await AsyncStorage.setItem('accessToken', data.accessToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

export const api = {
  get: (path: string) => request(path, { method: 'GET' }),
  post: (path: string, body: object, withAuth = true) =>
    request(path, { method: 'POST', body: JSON.stringify(body) }, withAuth),
  put: (path: string, body: object) =>
    request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path: string) => request(path, { method: 'DELETE' }),
};
