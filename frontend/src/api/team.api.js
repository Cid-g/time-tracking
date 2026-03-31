import apiClient from './axios.js';

export const getTeamStatsApi = () => apiClient.get('/team/stats');

export const listMembersApi = (params = {}) =>
  apiClient.get('/team', { params });

export const getMemberApi = (id) => apiClient.get(`/team/${id}`);

export const updateMemberRoleApi = (id, role) =>
  apiClient.patch(`/team/${id}/role`, { role });

export const updateMemberStatusApi = (id, isActive) =>
  apiClient.patch(`/team/${id}/status`, { isActive });

export const inviteMemberApi = (data) => apiClient.post('/team/invite', data);

// Phase 6B
export const getActivityFeedApi = (params = {}) =>
  apiClient.get('/team/activity', { params });

export const getLiveStatusApi = () => apiClient.get('/team/activity/live');

export const getTeamTimesheetsApi = (params = {}) =>
  apiClient.get('/team/timesheets', { params });

export const approveTeamTimesheetApi = (id) =>
  apiClient.patch(`/team/timesheets/${id}/approve`);

export const rejectTeamTimesheetApi = (id, comment) =>
  apiClient.patch(`/team/timesheets/${id}/reject`, { comment });

// Phase 6C
export const getHoursBreakdownApi = (params) =>
  apiClient.get('/team/analytics/hours', { params });

export const getProjectDistributionApi = (params) =>
  apiClient.get('/team/analytics/projects', { params });

export const getWeeklyTrendsApi = (params) =>
  apiClient.get('/team/analytics/trends', { params });
