import apiClient from './axios.js';

// Module 6: Productivity Pulse
export const getProductivityScoreApi = (params) =>
  apiClient.get('/member/productivity/score', { params });

export const getPeerComparisonApi = (params) =>
  apiClient.get('/member/productivity/peer-comparison', { params });

export const getActivityHeatmapApi = (params) =>
  apiClient.get('/member/productivity/heatmap', { params });

export const getTopAppsApi = (params) =>
  apiClient.get('/member/productivity/apps', { params });

// Module 7: Break Analytics
export const getBreakAnalyticsApi = (params) =>
  apiClient.get('/member/breaks/analytics', { params });

export const getBreakRecommendationsApi = (params) =>
  apiClient.get('/member/breaks/recommendations', { params });

export const getBreakSettingsApi = () =>
  apiClient.get('/member/breaks/settings');

export const updateBreakSettingsApi = (data) =>
  apiClient.patch('/member/breaks/settings', data);
