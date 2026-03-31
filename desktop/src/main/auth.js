import log from 'electron-log';
import { appStore } from './store.js';
import { apiClient, setAccessToken, clearAccessToken } from './api.js';

let currentUser = null;

export const authManager = {
  async login(email, password) {
    const response = await apiClient.login(email, password);
    const { user, accessToken, refreshToken } = response.data.data;

    setAccessToken(accessToken);
    appStore.set('refreshToken', refreshToken);
    appStore.set('userId', user._id);
    currentUser = user;

    log.info(`User logged in: ${user.email}`);
    return { user, accessToken };
  },

  async logout() {
    try {
      const refreshToken = appStore.get('refreshToken');
      if (refreshToken) {
        await apiClient.logout(refreshToken);
      }
    } catch (err) {
      log.warn('Logout API call failed:', err.message);
    }

    clearAccessToken();
    appStore.set('refreshToken', null);
    appStore.set('userId', null);
    currentUser = null;
    log.info('User logged out');
  },

  async tryRestoreSession() {
    const refreshToken = appStore.get('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await apiClient.refreshToken(refreshToken);
      const { accessToken, refreshToken: newRefreshToken } = response.data.data;

      setAccessToken(accessToken);
      if (newRefreshToken) {
        appStore.set('refreshToken', newRefreshToken);
      }

      // Fetch user profile
      const meResponse = await apiClient.getMe();
      currentUser = meResponse.data.data.user;
      appStore.set('userId', currentUser._id);

      log.info(`Session restored for: ${currentUser.email}`);
      return true;
    } catch (err) {
      log.warn('Session restore failed:', err.message);
      appStore.set('refreshToken', null);
      return false;
    }
  },

  getUser() {
    return currentUser;
  },

  isLoggedIn() {
    return currentUser !== null;
  },
};
