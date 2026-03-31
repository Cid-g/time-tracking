import apiClient from './axios.js';

export const createTaskApi = (projectId, data) => apiClient.post(`/tasks/project/${projectId}`, data);

export const listTasksApi = (projectId, params = {}) => apiClient.get(`/tasks/project/${projectId}`, { params });

export const getMyTasksApi = (params = {}) => apiClient.get('/tasks/my', { params });

export const updateTaskApi = (id, data) => apiClient.patch(`/tasks/${id}`, data);

export const deleteTaskApi = (id) => apiClient.delete(`/tasks/${id}`);
