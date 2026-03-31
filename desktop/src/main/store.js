import Store from 'electron-store';

export const appStore = new Store({
  name: 'workpulse-config',
  defaults: {
    apiUrl: 'http://localhost:5000/api',
    refreshToken: null,
    userId: null,
    settings: {
      idleThreshold: 300,        // 5 minutes in seconds
      monitoringInterval: 600,   // 10 minutes in seconds
      windowPollInterval: 5,     // 5 seconds
      launchOnStartup: false,
      screenshotEnabled: true,   // Capture screenshots during monitoring
      screenshotQuality: 65,     // JPEG quality (1-100)
    },
    offlineQueue: [],
  },
  encryptionKey: 'workpulse-v1',
});
