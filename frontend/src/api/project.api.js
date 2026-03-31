import apiClient from './axios.js';

export const createProjectApi = (data) => apiClient.post('/projects', data);

export const listProjectsApi = (params = {}) => apiClient.get('/projects', { params });

export const getProjectApi = (id) => apiClient.get(`/projects/${id}`);

export const updateProjectApi = (id, data) => apiClient.patch(`/projects/${id}`, data);

export const deleteProjectApi = (id) => apiClient.delete(`/projects/${id}`);

export const addProjectMembersApi = (id, data) => apiClient.post(`/projects/${id}/members`, data);

export const removeProjectMemberApi = (id, userId) => apiClient.delete(`/projects/${id}/members/${userId}`);

export const getProjectSummaryApi = (id, params = {}) => apiClient.get(`/projects/${id}/summary`, { params });
