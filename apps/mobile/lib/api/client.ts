import axios from 'axios';
import Config from '@/constants/Config';
import { secureStorage } from '../storage/secure-store';
import { cognitoAuth } from '../auth/cognito';

export const apiClient = axios.create({
  baseURL: Config.API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await secureStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const newToken = await cognitoAuth.refreshSession();

        if (newToken) {
          // Update the failed request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, sign out user
        await cognitoAuth.signOut();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
