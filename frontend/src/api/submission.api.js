import apiClient from './axios.js';

// Create a draft submission
export const createSubmissionApi = (data) =>
  apiClient.post('/submissions', data);

// List my submissions (paginated)
export const listMySubmissionsApi = (params = {}) =>
  apiClient.get('/submissions', { params });

// Get single submission detail
export const getSubmissionApi = (id) =>
  apiClient.get(`/submissions/${id}`);

// Submit a draft for approval
export const submitSubmissionApi = (id) =>
  apiClient.patch(`/submissions/${id}/submit`);

// Approve or reject a submission (manager/superadmin)
export const reviewSubmissionApi = (id, data) =>
  apiClient.patch(`/submissions/${id}/review`, data);

// List pending approvals (manager/superadmin)
export const listPendingApprovalsApi = (params = {}) =>
  apiClient.get('/submissions/pending', { params });

// Bulk submit multiple drafts
export const bulkSubmitApi = (submissionIds) =>
  apiClient.post('/submissions/bulk-submit', { submissionIds });

// Delete a draft submission
export const deleteSubmissionApi = (id) =>
  apiClient.delete(`/submissions/${id}`);
