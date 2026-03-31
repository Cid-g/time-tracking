import apiClient from './axios.js';

// Client Dashboard
export const getClientDashboardApi = () =>
  apiClient.get('/client/dashboard');

// Client Projects
export const listClientProjectsApi = (params = {}) =>
  apiClient.get('/client/projects', { params });

export const getClientProjectDetailApi = (id) =>
  apiClient.get(`/client/projects/${id}`);

// Client Reports
export const getClientProjectReportApi = (id, params) =>
  apiClient.get(`/client/projects/${id}/report`, { params });

export const exportClientProjectReportApi = (id, params) =>
  apiClient.get(`/client/projects/${id}/report/export`, {
    params,
    responseType: 'blob',
  });
