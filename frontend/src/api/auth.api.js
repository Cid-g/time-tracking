import apiClient from './axios.js';

export const loginApi = (credentials) =>
  apiClient.post('/auth/login', credentials);

export const registerApi = (data) =>
  apiClient.post('/auth/register', data);

export const refreshTokenApi = () =>
  apiClient.post('/auth/refresh-token');

export const logoutApi = () =>
  apiClient.post('/auth/logout');

export const getMeApi = () =>
  apiClient.get('/auth/me');

export const forgotPasswordApi = (email) =>
  apiClient.post('/auth/forgot-password', { email });

export const resetPasswordApi = (data) =>
  apiClient.post('/auth/reset-password', data);
