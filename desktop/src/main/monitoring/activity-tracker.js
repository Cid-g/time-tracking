import { powerMonitor } from 'electron';
import log from 'electron-log';

/**
 * Tracks mouse and keyboard activity using Electron's built-in APIs.
 *
 * Strategy:
 * - Mouse: polls screen.getCursorScreenPoint() every 500ms to detect movement.
 * - Keyboard: uses powerMonitor.getSystemIdleTime() to detect ANY input.
 *   When idle time resets but mouse didn't move → that's keyboard activity.
 *   This gives us real system-wide keyboard detection without native hooks.
 * - Overall: tracks distinct seconds where any input was detected.
 */

let isTracking = false;
let pollInterval = null;
let activeSeconds = new Set();  // Set of second timestamps with activity
let mouseEventCount = 0;
let keyboardEventCount = 0;
let lastMousePos = null;
let intervalStartTime = null;
let lastIdleTime = 0;          // Previous idle time reading

// Current live percentages (for UI push)
let liveMouseActivity = 0;
let liveKeyboardActivity = 0;
let liveOverallActivity = 0;

let screenModule = null;

function getScreen() {
  if (!screenModule) {
    const { screen } = require('electron');
    screenModule = screen;
  }
  return screenModule;
}

function trackActivity() {
  try {
    const screen = getScreen();
    const pos = screen.getCursorScreenPoint();
    const currentIdleTime = powerMonitor.getSystemIdleTime(); // seconds
    const now = Math.floor(Date.now() / 1000);

    const mouseMoved = lastMousePos && (pos.x !== lastMousePos.x || pos.y !== lastMousePos.y);

    if (mouseMoved) {
      mouseEventCount++;
      activeSeconds.add(now);
    }

    // Detect keyboard: idle time reset (went down) but mouse didn't move
    // OR idle time is very low (< 2s) and mouse didn't move — means recent keyboard input
    if (lastIdleTime > 0 && currentIdleTime < lastIdleTime && !mouseMoved) {
      keyboardEventCount++;
      activeSeconds.add(now);
    }

    // Also: if idle time is < 1 second AND mouse didn't move, there's recent keyboard input
    if (currentIdleTime < 1 && !mouseMoved && lastMousePos) {
      keyboardEventCount++;
      activeSeconds.add(now);
    }

    lastMousePos = pos;
    lastIdleTime = currentIdleTime;

    // Update live percentages (rolling window of last 60 seconds for responsive UI)
    updateLivePercentages();
  } catch {
    // Screen not available yet
  }
}

function updateLivePercentages() {
  if (!intervalStartTime) return;

  const totalSeconds = Math.max(1, Math.floor((Date.now() - intervalStartTime.getTime()) / 1000));
  const totalActive = activeSeconds.size;

  liveMouseActivity = Math.min(100, Math.round((mouseEventCount / (totalSeconds * 2)) * 100));
  liveKeyboardActivity = Math.min(100, Math.round((keyboardEventCount / (totalSeconds * 2)) * 100));
  liveOverallActivity = Math.min(100, Math.round((totalActive / totalSeconds) * 100));
}

export const activityTracker = {
  start() {
    if (isTracking) return;
    isTracking = true;
    intervalStartTime = new Date();
    activeSeconds.clear();
    mouseEventCount = 0;
    keyboardEventCount = 0;
    lastMousePos = null;
    lastIdleTime = 0;
    liveMouseActivity = 0;
    liveKeyboardActivity = 0;
    liveOverallActivity = 0;

    // Poll every 500ms for mouse + keyboard detection
    pollInterval = setInterval(trackActivity, 500);

    log.info('Activity tracker started (mouse + keyboard via idle detection)');
  },

  stop() {
    if (!isTracking) return;
    isTracking = false;
    clearInterval(pollInterval);
    pollInterval = null;
    liveMouseActivity = 0;
    liveKeyboardActivity = 0;
    liveOverallActivity = 0;
    log.info('Activity tracker stopped');
  },

  /**
   * Returns current live activity percentages for UI display.
   * Does NOT reset counters — call this frequently for live updates.
   */
  getLiveActivity() {
    return {
      mouseActivity: liveMouseActivity,
      keyboardActivity: liveKeyboardActivity,
      overallActivity: liveOverallActivity,
    };
  },

  /**
   * Collects and resets the activity snapshot for the current interval.
   * Returns activity percentages based on active seconds vs total seconds.
   */
  collectAndReset() {
    const now = new Date();
    const start = intervalStartTime || now;
    const totalSeconds = Math.max(1, Math.floor((now - start) / 1000));

    const totalActive = activeSeconds.size;
    const mouseActivity = Math.min(100, Math.round((mouseEventCount / (totalSeconds * 2)) * 100));
    const keyboardActivity = Math.min(100, Math.round((keyboardEventCount / (totalSeconds * 2)) * 100));
    const overallActivity = Math.min(100, Math.round((totalActive / totalSeconds) * 100));

    const snapshot = {
      intervalStart: start.toISOString(),
      intervalEnd: now.toISOString(),
      intervalDuration: totalSeconds,
      mouseActivity,
      keyboardActivity,
      overallActivity,
      mouseEventCount,
      keyboardEventCount,
      totalActiveSeconds: totalActive,
    };

    // Reset for next interval
    activeSeconds.clear();
    mouseEventCount = 0;
    keyboardEventCount = 0;
    intervalStartTime = new Date();
    lastIdleTime = 0;

    return snapshot;
  },

  isActive() {
    return isTracking;
  },
};
