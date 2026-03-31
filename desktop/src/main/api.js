import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import log from 'electron-log';
import { appStore } from './store.js';

let accessToken = null;
let isRefreshing = false;
let refreshQueue = [];

const api = axios.create({
  baseURL: appStore.get('apiUrl'),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor — handle 401 + silent refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh for auth endpoints
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/refresh-token') ||
      originalRequest.url?.includes('/auth/login')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until refresh completes
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then(() => {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = appStore.get('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');

      const response = await api.post('/auth/refresh-token', { refreshToken });
      const { accessToken: newAccess, refreshToken: newRefresh } = response.data.data;

      setAccessToken(newAccess);
      if (newRefresh) {
        appStore.set('refreshToken', newRefresh);
      }

      // Replay queued requests
      refreshQueue.forEach((p) => p.resolve());
      refreshQueue = [];

      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return api(originalRequest);
    } catch (refreshErr) {
      log.error('Token refresh failed:', refreshErr.message);
      refreshQueue.forEach((p) => p.reject(refreshErr));
      refreshQueue = [];

      // Clear stored tokens
      accessToken = null;
      appStore.set('refreshToken', null);

      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

function setAccessToken(token) {
  accessToken = token;
}

function getAccessToken() {
  return accessToken;
}

function clearAccessToken() {
  accessToken = null;
}

// ── API Methods ──

const apiClient = {
  // Auth
  login: (email, password) =>
    api.post('/auth/login', { email, password, deviceType: 'desktop' }),

  refreshToken: (refreshToken) =>
    api.post('/auth/refresh-token', { refreshToken }),

  logout: (refreshToken) =>
    api.post('/auth/logout', { refreshToken }),

  getMe: () => api.get('/auth/me'),

  // Timer
  startTimer: (data = {}) => api.post('/time-entries/timer/start', data),
  stopTimer: (id) => api.patch(`/time-entries/timer/${id}/stop`),
  pauseTimer: (id) => api.patch(`/time-entries/timer/${id}/pause`),
  resumeTimer: (id) => api.patch(`/time-entries/timer/${id}/resume`),
  getActiveTimer: () => api.get('/time-entries/timer/active'),

  // Projects & Tasks (for dropdowns)
  getProjects: () => api.get('/projects'),
  getTasksByProject: (projectId) => api.get(`/tasks/project/${projectId}`, { params: { limit: 100 } }),

  // Activity logs
  batchCreateActivityLogs: (logs) => api.post('/activity-logs/batch', { logs }),

  // Screenshots
  uploadScreenshot: async (filePath, timeEntryId) => {
    const form = new FormData();
    form.append('screenshot', fs.createReadStream(filePath));
    form.append('timeEntry', timeEntryId);

    const response = await api.post('/screenshots/upload', form, {
      headers: form.getHeaders(),
      timeout: 30000,
      maxContentLength: 5 * 1024 * 1024,
    });

    return response.data.data.screenshotId;
  },
};

export { apiClient, setAccessToken, getAccessToken, clearAccessToken, api };
