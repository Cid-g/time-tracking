import apiClient from './axios.js';

// Module 28: Productivity Trends
export const getProductivityTrendsApi = (params) =>
  apiClient.get('/admin/reports/productivity-trends', { params });

export const exportProductivityTrendsApi = (params) =>
  apiClient.get('/admin/reports/productivity-trends/export', { params, responseType: 'blob' });

// Module 29: Activity Levels
export const getActivityLevelsApi = (params) =>
  apiClient.get('/admin/reports/activity-levels', { params });

export const getActivityHeatmapApi = (params) =>
  apiClient.get('/admin/reports/activity-levels/heatmap', { params });

// Module 30: App & Website Usage
export const getAppUsageApi = (params) =>
  apiClient.get('/admin/reports/app-usage', { params });
