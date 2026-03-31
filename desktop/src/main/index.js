import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import log from 'electron-log';
import { initTray, updateTrayMenu } from './tray.js';
import { authManager } from './auth.js';
import { apiClient } from './api.js';
import { appStore } from './store.js';
import { monitorManager } from './monitoring/monitor-manager.js';
import { syncManager } from './sync/sync-manager.js';
import { screenshotCapturer } from './monitoring/screenshot-capturer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

log.initialize();
log.info('App starting...');

let mainWindow = null;

// Enforce single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 680,
    resizable: false,
    show: false,
    frame: false,
    transparent: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  mainWindow.on('close', (e) => {
    // Minimize to tray instead of closing
    e.preventDefault();
    mainWindow.hide();
  });

  return mainWindow;
}

function showWindow() {
  if (!mainWindow) {
    createWindow();
  }
  mainWindow.show();
  mainWindow.center();
  mainWindow.focus();
}

// ── IPC Handlers ──

ipcMain.handle('auth:login', async (_event, { email, password }) => {
  try {
    const result = await authManager.login(email, password);
    updateTrayMenu(true, result.user);
    return { success: true, data: result };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('auth:logout', async () => {
  try {
    // Stop monitoring on logout
    stopLiveStatsPush();
    if (monitorManager.isMonitoring()) {
      await monitorManager.stop();
      await syncManager.forceSync();
      syncManager.stop();
    }
    await authManager.logout();
    updateTrayMenu(false);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('auth:getUser', () => {
  return authManager.getUser();
});

ipcMain.handle('auth:isLoggedIn', () => {
  return authManager.isLoggedIn();
});

ipcMain.handle('timer:start', async (_event, data = {}) => {
  try {
    const result = await apiClient.startTimer(data);
    const entry = result.data.data?.entry || result.data.entry;
    updateTrayMenu(true, authManager.getUser(), entry);

    // Start monitoring
    if (entry?._id) {
      await monitorManager.start(entry._id);
      syncManager.start();
      startLiveStatsPush();
    }

    return { success: true, data: result.data };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('timer:stop', async (_event, entryId) => {
  try {
    // Stop monitoring first to flush data
    stopLiveStatsPush();
    await monitorManager.stop();
    await syncManager.forceSync();
    syncManager.stop();

    const result = await apiClient.stopTimer(entryId);
    updateTrayMenu(true, authManager.getUser(), null);
    return { success: true, data: result.data };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('timer:pause', async (_event, entryId) => {
  try {
    const result = await apiClient.pauseTimer(entryId);
    const entry = result.data.data?.entry || result.data.entry;
    updateTrayMenu(true, authManager.getUser(), entry);

    // Pause monitoring
    monitorManager.pause();
    stopLiveStatsPush();

    return { success: true, data: result.data };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('timer:resume', async (_event, entryId) => {
  try {
    const result = await apiClient.resumeTimer(entryId);
    const entry = result.data.data?.entry || result.data.entry;
    updateTrayMenu(true, authManager.getUser(), entry);

    // Resume monitoring
    await monitorManager.resume();
    startLiveStatsPush();

    return { success: true, data: result.data };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('timer:getActive', async () => {
  try {
    const result = await apiClient.getActiveTimer();
    return { success: true, data: result.data };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('projects:list', async () => {
  try {
    const result = await apiClient.getProjects();
    return { success: true, data: result.data };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('tasks:listByProject', async (_event, projectId) => {
  try {
    const result = await apiClient.getTasksByProject(projectId);
    return { success: true, data: result.data };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// ── Live Activity Stats Push ──
let liveStatsInterval = null;

function startLiveStatsPush() {
  stopLiveStatsPush();
  liveStatsInterval = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const stats = monitorManager.getLiveStats();
    if (stats) {
      mainWindow.webContents.send('activity:live-stats', stats);
    }
  }, 3000); // Push every 3 seconds
}

function stopLiveStatsPush() {
  if (liveStatsInterval) {
    clearInterval(liveStatsInterval);
    liveStatsInterval = null;
  }
}

ipcMain.handle('window:show', () => showWindow());
ipcMain.handle('window:hide', () => mainWindow?.hide());
ipcMain.handle('app:quit', async () => {
  // Cleanup monitoring before quit
  stopLiveStatsPush();
  if (monitorManager.isMonitoring()) {
    await monitorManager.stop();
    await syncManager.forceSync();
    syncManager.stop();
  }
  mainWindow?.destroy();
  app.exit(0);
});

// ── App Lifecycle ──

app.whenReady().then(async () => {
  createWindow();
  initTray(showWindow);

  // Try silent login on startup
  const restored = await authManager.tryRestoreSession();
  if (restored) {
    log.info('Session restored successfully');
    updateTrayMenu(true, authManager.getUser());

    // Cleanup old local screenshots (>30 days)
    const userId = appStore.get('userId');
    if (userId) {
      screenshotCapturer.cleanupOldScreenshots(userId).catch((err) => {
        log.warn('Screenshot cleanup error:', err.message);
      });
    }

    // Check for active timer and resume monitoring
    try {
      const timerResult = await apiClient.getActiveTimer();
      const entry = timerResult.data?.data?.entry || timerResult.data?.entry;
      if (entry && ['running', 'paused'].includes(entry.status)) {
        updateTrayMenu(true, authManager.getUser(), entry);
        if (entry.status === 'running') {
          await monitorManager.start(entry._id);
          syncManager.start();
          startLiveStatsPush();
        }
      }
    } catch {
      // No active timer or error — that's fine
    }
  } else {
    log.info('No saved session, showing login window');
    showWindow();
  }
});

app.on('window-all-closed', (e) => {
  // Prevent default quit — keep tray alive
  e.preventDefault();
});

// Export for tray.js access
export { showWindow, mainWindow };
