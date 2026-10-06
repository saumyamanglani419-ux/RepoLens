import axios, { AxiosError } from 'axios';
import type {
  AnalysisDetail,
  AnalysisListItem,
  DashboardStats,
  Pagination,
  User,
} from '@/types';

/**
 * Axios instance for the RepoLens API. Auth uses an httpOnly cookie set by the
 * server, so no token is ever stored in JavaScript-accessible storage.
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 90_000,
});

export const AUTH_EXPIRED_EVENT = 'repolens:auth-expired';

http.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.startsWith('/auth/')) {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  },
);

interface ApiErrorBody {
  error?: { message?: string; code?: string; details?: { fields?: Record<string, string> } };
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  fields?: Record<string, string>;
}

/** Normalises any thrown value into a user-friendly error object. */
export function toApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as ApiErrorBody | undefined;
    if (body?.error?.message) {
      return {
        message: body.error.message,
        code: body.error.code,
        status: err.response?.status,
        fields: body.error.details?.fields,
      };
    }
    if (err.code === 'ECONNABORTED') return { message: 'The request timed out. Please try again.', code: 'TIMEOUT' };
    if (!err.response) return { message: 'Cannot reach the RepoLens server. Is the API running?', code: 'NETWORK' };
    return { message: `Request failed (${err.response.status}).`, status: err.response.status };
  }
  return { message: err instanceof Error ? err.message : 'Something went wrong.' };
}

// ───────────── Auth ─────────────
export const authApi = {
  me: () => http.get<{ user: User }>('/auth/me').then((r) => r.data.user),
  login: (body: { email: string; password: string }) =>
    http.post<{ user: User }>('/auth/login', body).then((r) => r.data.user),
  register: (body: { name: string; email: string; password: string }) =>
    http.post<{ user: User }>('/auth/register', body).then((r) => r.data.user),
  logout: () => http.post('/auth/logout'),
  updateProfile: (body: { name: string }) => http.patch<{ user: User }>('/auth/me', body).then((r) => r.data.user),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    http.patch<{ user: User }>('/auth/password', body).then((r) => r.data.user),
  deleteAccount: (body: { password: string }) => http.delete('/auth/me', { data: body }),
};

// ───────────── Analyses ─────────────
export interface ListParams {
  page?: number;
  limit?: number;
  q?: string;
  sort?: 'recent' | 'oldest' | 'name' | 'health' | 'stars';
}

export const analysisApi = {
  create: (url: string) =>
    http.post<{ analysis: AnalysisDetail }>('/analyses', { url }).then((r) => r.data.analysis),
  list: (params: ListParams = {}) =>
    http
      .get<{ items: AnalysisListItem[]; pagination: Pagination }>('/analyses', { params })
      .then((r) => r.data),
  get: (id: string) => http.get<{ analysis: AnalysisDetail }>(`/analyses/${id}`).then((r) => r.data.analysis),
  reanalyze: (id: string) =>
    http.post<{ analysis: AnalysisDetail }>(`/analyses/${id}/reanalyze`).then((r) => r.data.analysis),
  remove: (id: string) => http.delete(`/analyses/${id}`),
  clearAll: () => http.delete<{ deleted: number }>('/analyses').then((r) => r.data.deleted),
  stats: () => http.get<DashboardStats>('/analyses/stats').then((r) => r.data),
};
