import { CONFIG } from '../config';

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

class ApiService {
  private baseUrl = CONFIG.API_BASE;
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  async request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };
    
    if (options?.body) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token && this.token !== 'undefined' && this.token !== 'null') {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        cache: 'no-store',
        headers: {
          ...headers,
          ...(options?.headers as Record<string, string> || {})
        },
      });

      const contentType = res.headers.get('content-type');
      const data = contentType?.includes('application/json') ? await res.json() : null;

      if (!res.ok) {
        // Log the specific error message from the server to the console
        console.error('API Error Details:', data);
        
        const errorData = data?.error || { code: 'UNKNOWN_ERROR', message: `Error ${res.status}` };
        return {
          data: null,
          error: { ...errorData, status: res.status }
        };
      }

      return { data: data as T, error: null };
    } catch {
      return {
        data: null,
        error: { code: 'NETWORK_ERROR', message: 'Network connection error', status: 0 }
      };
    }
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'GET' });
  }

  async post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export const api = new ApiService();