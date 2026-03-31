const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Auth
  login: (email, password) => ipcRenderer.invoke('auth:login', { email, password }),
  logout: () => ipcRenderer.invoke('auth:logout'),
  getUser: () => ipcRenderer.invoke('auth:getUser'),
  isLoggedIn: () => ipcRenderer.invoke('auth:isLoggedIn'),

  // Timer
  startTimer: (data) => ipcRenderer.invoke('timer:start', data),
  stopTimer: (entryId) => ipcRenderer.invoke('timer:stop', entryId),
  pauseTimer: (entryId) => ipcRenderer.invoke('timer:pause', entryId),
  resumeTimer: (entryId) => ipcRenderer.invoke('timer:resume', entryId),
  getActiveTimer: () => ipcRenderer.invoke('timer:getActive'),

  // Projects & Tasks
  getProjects: () => ipcRenderer.invoke('projects:list'),
  getTasksByProject: (projectId) => ipcRenderer.invoke('tasks:listByProject', projectId),

  // Live activity stats (main → renderer push)
  onLiveStats: (callback) => {
    const handler = (_event, stats) => callback(stats);
    ipcRenderer.on('activity:live-stats', handler);
    // Return cleanup function
    return () => ipcRenderer.removeListener('activity:live-stats', handler);
  },

  // Window
  showWindow: () => ipcRenderer.invoke('window:show'),
  hideWindow: () => ipcRenderer.invoke('window:hide'),
  quitApp: () => ipcRenderer.invoke('app:quit'),
});
