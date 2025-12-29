/**
 * Authenticated API Client
 *
 * Provides utilities for making authenticated HTTP requests to the backend API.
 * Automatically includes authentication tokens and handles common error cases.
 */

import { getAccessTokenString, formatAuthError } from '@/lib/auth';

/**
 * API Client Configuration
 */
interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * API Request Options
 */
interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
  timeout?: number;
}

/**
 * API Error Response
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Authenticated API Client
 */
export class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private defaultHeaders: Record<string, string>;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || process.env.NEXT_PUBLIC_API_URL || '/api';
    this.defaultTimeout = config.timeout || 30000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(path: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(path, this.baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    return url.toString();
  }

  /**
   * Get request headers with authentication
   */
  private async getHeaders(additionalHeaders?: Record<string, string>): Promise<Record<string, string>> {
    const token = await getAccessTokenString();

    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...additionalHeaders,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Make an authenticated request with timeout
   */
  private async request<T>(
    path: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const { params, timeout = this.defaultTimeout, ...fetchOptions } = options;

    const url = this.buildUrl(path, params);
    const headers = await this.getHeaders(fetchOptions.headers as Record<string, string>);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      const isJson = contentType?.includes('application/json');

      if (!response.ok) {
        const errorBody = isJson ? await response.json() : await response.text();
        const errorMessage = typeof errorBody === 'object' && errorBody.message
          ? errorBody.message
          : 'Request failed';

        throw new ApiError(errorMessage, response.status, errorBody);
      }

      return (isJson ? await response.json() : await response.text()) as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('Request timeout', 408);
        }

        throw new ApiError(formatAuthError(error), 0);
      }

      throw new ApiError('An unknown error occurred', 0);
    }
  }

  /**
   * GET request
   */
  async get<T>(path: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(path: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(path: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(path: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(path: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'DELETE',
    });
  }

  /**
   * Upload file with multipart/form-data
   */
  async uploadFile<T>(
    path: string,
    file: File,
    additionalFields?: Record<string, string>
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalFields) {
      Object.entries(additionalFields).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const token = await getAccessTokenString();
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(this.buildUrl(path), {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.message || 'Upload failed';
      throw new ApiError(errorMessage, response.status, errorBody);
    }

    return response.json();
  }
}

/**
 * Default API client instance
 */
export const apiClient = new ApiClient();

/**
 * Convenience methods using the default client
 */
export const api = {
  get: <T>(path: string, options?: ApiRequestOptions) => apiClient.get<T>(path, options),
  post: <T>(path: string, data?: unknown, options?: ApiRequestOptions) =>
    apiClient.post<T>(path, data, options),
  put: <T>(path: string, data?: unknown, options?: ApiRequestOptions) =>
    apiClient.put<T>(path, data, options),
  patch: <T>(path: string, data?: unknown, options?: ApiRequestOptions) =>
    apiClient.patch<T>(path, data, options),
  delete: <T>(path: string, options?: ApiRequestOptions) => apiClient.delete<T>(path, options),
  uploadFile: <T>(path: string, file: File, additionalFields?: Record<string, string>) =>
    apiClient.uploadFile<T>(path, file, additionalFields),
};
