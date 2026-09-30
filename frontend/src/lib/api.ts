import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getSession, signOut } from 'next-auth/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Check if running in browser environment
    if (typeof window !== 'undefined') {
      const session = await getSession();
      const token = session?.user?.accessToken;

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      if (window.location.pathname !== '/login') {
        // Clear session and redirect to login on 401 Unauthorized
        await signOut({ callbackUrl: '/login' });
      }
    }
    return Promise.reject(error);
  }
);

export default api;