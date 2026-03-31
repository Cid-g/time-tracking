import apiClient from './axios.js';

// Timer actions
export const startTimerApi = (data = {}) =>
  apiClient.post('/time-entries/timer/start', data);

export const stopTimerApi = (id) =>
  apiClient.patch(`/time-entries/timer/${id}/stop`);

export const pauseTimerApi = (id) =>
  apiClient.patch(`/time-entries/timer/${id}/pause`);

export const resumeTimerApi = (id) =>
  apiClient.patch(`/time-entries/timer/${id}/resume`);

export const getActiveTimerApi = () =>
  apiClient.get('/time-entries/timer/active');

// Manual entry
export const createManualEntryApi = (data) =>
  apiClient.post('/time-entries/manual', data);

// CRUD
export const listTimeEntriesApi = (params = {}) =>
  apiClient.get('/time-entries', { params });

export const getTimeEntryApi = (id) =>
  apiClient.get(`/time-entries/${id}`);

export const updateTimeEntryApi = (id, data) =>
  apiClient.patch(`/time-entries/${id}`, data);

export const deleteTimeEntryApi = (id) =>
  apiClient.delete(`/time-entries/${id}`);

// Analytics
export const getTimeSummaryApi = (params = {}) =>
  apiClient.get('/time-entries/summary', { params });

export const getDailyBreakdownApi = (params = {}) =>
  apiClient.get('/time-entries/daily-breakdown', { params });
