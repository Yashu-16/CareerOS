import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/stores/auth.store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<() => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    if (error.response?.status !== 401 || !originalRequest || (originalRequest as any)._retry) {
      return Promise.reject(error);
    }

    const { refreshToken, setAuth, clearAuth, user } = useAuthStore.getState();
    if (!refreshToken) {
      clearAuth();
      return Promise.reject(error);
    }

    (originalRequest as any)._retry = true;

    if (isRefreshing) {
      // Queue this request until the in-flight refresh resolves.
      return new Promise((resolve) => {
        pendingQueue.push(() => resolve(api(originalRequest)));
      });
    }

    isRefreshing = true;
    try {
      const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
      setAuth({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user || user! });
      pendingQueue.forEach((resolve) => resolve());
      pendingQueue = [];
      return api(originalRequest);
    } catch (refreshError) {
      clearAuth();
      pendingQueue = [];
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
