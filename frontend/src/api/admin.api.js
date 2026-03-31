import apiClient from './axios.js';

// Module 25: Timesheet Explorer
export const getAdminTimesheetsApi = (params = {}) =>
  apiClient.get('/admin/timesheets', { params });

export const editAdminTimeEntryApi = (id, data) =>
  apiClient.patch(`/admin/timesheets/${id}`, data);

export const exportAdminTimesheetsApi = (params) =>
  apiClient.get('/admin/timesheets/export', { params, responseType: 'blob' });

export const runComplianceCheckApi = (data) =>
  apiClient.post('/admin/timesheets/compliance', data);

export const bulkTimesheetActionApi = (data) =>
  apiClient.post('/admin/timesheets/bulk', data);

// Module 26: Approvals Hub
export const getAdminApprovalsApi = (params = {}) =>
  apiClient.get('/admin/approvals', { params });

export const bulkApprovalActionApi = (data) =>
  apiClient.post('/admin/approvals/bulk', data);

export const delegateApprovalApi = (id, data) =>
  apiClient.post(`/admin/approvals/${id}/delegate`, data);

export const getApprovalHistoryApi = (params = {}) =>
  apiClient.get('/admin/approvals/history', { params });

// Module 27: Audit Trail
export const getAuditLogsApi = (params = {}) =>
  apiClient.get('/admin/audit-logs', { params });

export const getAuditLogDetailApi = (id) =>
  apiClient.get(`/admin/audit-logs/${id}`);

export const exportAuditLogsApi = (params) =>
  apiClient.get('/admin/audit-logs/export', { params, responseType: 'blob' });

export const detectAnomaliesApi = (params) =>
  apiClient.get('/admin/audit-logs/anomalies', { params });
