import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 25000,
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('schedflow_token') ||
    sessionStorage.getItem('schedflow_token') ||
    localStorage.getItem('schedflow_token6') ||
    sessionStorage.getItem('schedflow_token6');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('schedflow_token');
      sessionStorage.removeItem('schedflow_token');
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(err: any, fallback = 'An unexpected error occurred'): string {
  if (!err) return fallback;
  const detail = err.response?.data?.detail ?? err.message;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d: any) => {
        if (typeof d === 'string') return d;
        if (d.loc && d.msg) {
          const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : d.loc;
          return `${field}: ${d.msg}`;
        }
        return d.msg || JSON.stringify(d);
      })
      .join('\n');
  }
  if (typeof detail === 'object' && detail !== null) {
    if (detail.message) return detail.message;
    return JSON.stringify(detail);
  }
  return String(detail || fallback);
}

export default api;
