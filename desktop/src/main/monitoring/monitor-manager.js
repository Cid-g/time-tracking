import log from 'electron-log';
import { activityTracker } from './activity-tracker.js';
import { windowTracker } from './window-tracker.js';
import { idleDetector } from './idle-detector.js';
import { screenshotCapturer } from './screenshot-capturer.js';
import { appStore } from '../store.js';

let snapshotInterval = null;
let currentTimeEntryId = null;
let pendingSnapshots = [];

/**
 * MonitorManager orchestrates activity tracking, window tracking, idle detection,
 * and screenshot capture. It collects snapshots at configured intervals and stores them for sync.
 */
export const monitorManager = {
  async start(timeEntryId) {
    if (!timeEntryId) {
      log.warn('MonitorManager: Cannot start without a time entry ID');
      return;
    }

    currentTimeEntryId = timeEntryId;
    pendingSnapshots = [];

    activityTracker.start();
    await windowTracker.start();
    idleDetector.start({
      onIdle: () => {
        log.info('MonitorManager: User went idle');
      },
      onActive: () => {
        log.info('MonitorManager: User returned from idle');
      },
    });

    // Collect snapshots at configured interval
    const intervalMs = (appStore.get('settings.monitoringInterval') || 600) * 1000;
    snapshotInterval = setInterval(() => {
      this.collectSnapshot();
    }, intervalMs);

    log.info(`MonitorManager started for entry ${timeEntryId}, interval: ${intervalMs / 1000}s`);
  },

  async stop() {
    // Collect final snapshot before stopping
    if (currentTimeEntryId) {
      await this.collectSnapshot();
    }

    activityTracker.stop();
    windowTracker.stop();
    idleDetector.stop();
    clearInterval(snapshotInterval);
    snapshotInterval = null;
    currentTimeEntryId = null;

    log.info('MonitorManager stopped');
  },

  pause() {
    activityTracker.stop();
    windowTracker.stop();
    idleDetector.stop(); // Stop idle detector on pause to prevent incorrect accumulation
    clearInterval(snapshotInterval);
    snapshotInterval = null;
    log.info('MonitorManager paused');
  },

  async resume() {
    if (!currentTimeEntryId) return;

    activityTracker.start();
    await windowTracker.start();
    idleDetector.start({
      onIdle: () => {
        log.info('MonitorManager: User went idle');
      },
      onActive: () => {
        log.info('MonitorManager: User returned from idle');
      },
    });

    const intervalMs = (appStore.get('settings.monitoringInterval') || 600) * 1000;
    snapshotInterval = setInterval(() => {
      this.collectSnapshot();
    }, intervalMs);

    log.info('MonitorManager resumed');
  },

  async collectSnapshot() {
    if (!currentTimeEntryId) return null;

    const activity = activityTracker.collectAndReset();
    const windows = windowTracker.collectAndReset();
    const idleTime = idleDetector.collectAndReset();

    const snapshot = {
      timeEntry: currentTimeEntryId,
      intervalStart: activity.intervalStart,
      intervalEnd: activity.intervalEnd,
      intervalDuration: activity.intervalDuration,
      mouseActivity: activity.mouseActivity,
      keyboardActivity: activity.keyboardActivity,
      overallActivity: activity.overallActivity,
      activeWindows: windows,
      idleTime,
    };

    // Capture screenshot if enabled
    const screenshotEnabled = appStore.get('settings.screenshotEnabled') !== false;
    if (screenshotEnabled) {
      try {
        const userId = appStore.get('userId');
        if (userId) {
          const screenshotInfo = await screenshotCapturer.capture(userId);
          if (screenshotInfo) {
            snapshot._screenshotPath = screenshotInfo.filePath;
          }
        }
      } catch (err) {
        log.error('MonitorManager: Screenshot capture failed:', err.message);
      }
    }

    pendingSnapshots.push(snapshot);
    log.info(`Snapshot collected: activity=${snapshot.overallActivity}%, windows=${windows.length}, idle=${idleTime}s, screenshot=${!!snapshot._screenshotPath}`);

    return snapshot;
  },

  /**
   * Returns live activity stats for UI display.
   * Call this frequently (every 3s) — does NOT reset any counters.
   */
  getLiveStats() {
    if (!currentTimeEntryId) {
      return null;
    }

    const activity = activityTracker.getLiveActivity();
    const currentApp = windowTracker.getCurrentAppName();
    const isIdle = idleDetector.isIdle();

    return {
      mouseActivity: activity.mouseActivity,
      keyboardActivity: activity.keyboardActivity,
      overallActivity: activity.overallActivity,
      currentApp: currentApp || 'No app detected',
      isIdle,
    };
  },

  /**
   * Returns all pending snapshots and clears the buffer.
   * Used by SyncManager to batch-send to backend.
   */
  flushSnapshots() {
    const flushed = [...pendingSnapshots];
    pendingSnapshots = [];
    return flushed;
  },

  getPendingCount() {
    return pendingSnapshots.length;
  },

  isMonitoring() {
    return activityTracker.isActive();
  },

  getCurrentTimeEntryId() {
    return currentTimeEntryId;
  },
};
