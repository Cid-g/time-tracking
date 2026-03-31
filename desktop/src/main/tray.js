import { Tray, Menu, nativeImage, app } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import log from 'electron-log';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let tray = null;
let showWindowFn = null;
let timerInterval = null;
let currentEntry = null;

// Timer elapsed time for tooltip
function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function calculateElapsed(entry) {
  if (!entry || !entry.startTime) return 0;
  const start = new Date(entry.startTime).getTime();
  const now = Date.now();
  const elapsed = Math.floor((now - start) / 1000);
  const breakDuration = entry.totalBreakDuration || 0;
  return Math.max(0, elapsed - breakDuration);
}

function startTimerTick() {
  stopTimerTick();
  timerInterval = setInterval(() => {
    if (tray && currentEntry) {
      const elapsed = calculateElapsed(currentEntry);
      const status = currentEntry.status === 'paused' ? '⏸' : '▶';
      tray.setToolTip(`WorkPulse ${status} ${formatDuration(elapsed)}`);
    }
  }, 1000);
}

function stopTimerTick() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function createTrayIcon() {
  // Create a simple 16x16 icon programmatically
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAARklEQVQ4T2NkoBAwUqifYdQABmpEAcMgCIH/DAwM/6EuYGBgZIT7gNwQIJoXiDaAWF4g2gBieYFoA4jlBaINIJYXBn4IAAD2kBARi6VqHAAAAABJRU5ErkJggg=='
  );
  return icon;
}

export function initTray(showWindow) {
  showWindowFn = showWindow;
  const icon = createTrayIcon();
  tray = new Tray(icon);
  tray.setToolTip('WorkPulse');

  tray.on('click', () => {
    if (showWindowFn) showWindowFn();
  });

  updateTrayMenu(false);
}

export function updateTrayMenu(isLoggedIn, user = null, activeEntry = null) {
  currentEntry = activeEntry;

  if (!tray) return;

  if (!isLoggedIn) {
    stopTimerTick();
    const menu = Menu.buildFromTemplate([
      { label: 'WorkPulse', enabled: false },
      { type: 'separator' },
      { label: 'Login', click: () => showWindowFn?.() },
      { type: 'separator' },
      { label: 'Quit', click: () => { tray?.destroy(); app.exit(0); } },
    ]);
    tray.setContextMenu(menu);
    tray.setToolTip('WorkPulse — Not logged in');
    return;
  }

  const userName = user ? `${user.firstName} ${user.lastName}` : 'User';
  const hasActiveTimer = activeEntry && ['running', 'paused'].includes(activeEntry.status);
  const isPaused = activeEntry?.status === 'paused';

  if (hasActiveTimer) {
    startTimerTick();
  } else {
    stopTimerTick();
    tray.setToolTip(`WorkPulse — ${userName}`);
  }

  const template = [
    { label: `Logged in as ${userName}`, enabled: false },
    { type: 'separator' },
  ];

  if (!hasActiveTimer) {
    template.push({
      label: '▶  Start Timer',
      click: async () => {
        try {
          const { apiClient } = await import('./api.js');
          const result = await apiClient.startTimer();
          const entry = result.data.data?.entry || result.data.entry;
          updateTrayMenu(true, user, entry);
        } catch (err) {
          log.error('Failed to start timer:', err.message);
        }
      },
    });
  } else {
    const elapsed = calculateElapsed(activeEntry);
    template.push({
      label: `⏱  Timer: ${formatDuration(elapsed)}${isPaused ? ' (Paused)' : ''}`,
      enabled: false,
    });

    if (isPaused) {
      template.push({
        label: '▶  Resume Timer',
        click: async () => {
          try {
            const { apiClient } = await import('./api.js');
            const result = await apiClient.resumeTimer(activeEntry._id);
            const entry = result.data.data?.entry || result.data.entry;
            updateTrayMenu(true, user, entry);
          } catch (err) {
            log.error('Failed to resume timer:', err.message);
          }
        },
      });
    } else {
      template.push({
        label: '⏸  Pause Timer',
        click: async () => {
          try {
            const { apiClient } = await import('./api.js');
            const result = await apiClient.pauseTimer(activeEntry._id);
            const entry = result.data.data?.entry || result.data.entry;
            updateTrayMenu(true, user, entry);
          } catch (err) {
            log.error('Failed to pause timer:', err.message);
          }
        },
      });
    }

    template.push({
      label: '⏹  Stop Timer',
      click: async () => {
        try {
          const { apiClient } = await import('./api.js');
          await apiClient.stopTimer(activeEntry._id);
          updateTrayMenu(true, user, null);
        } catch (err) {
          log.error('Failed to stop timer:', err.message);
        }
      },
    });
  }

  template.push(
    { type: 'separator' },
    { label: 'Open Dashboard', click: () => showWindowFn?.() },
    {
      label: 'Logout',
      click: async () => {
        const { authManager } = await import('./auth.js');
        await authManager.logout();
        stopTimerTick();
        updateTrayMenu(false);
        showWindowFn?.();
      },
    },
    { type: 'separator' },
    { label: 'Quit', click: () => { stopTimerTick(); tray?.destroy(); app.exit(0); } },
  );

  const menu = Menu.buildFromTemplate(template);
  tray.setContextMenu(menu);
}
