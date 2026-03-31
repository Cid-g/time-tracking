import { powerMonitor } from 'electron';
import log from 'electron-log';
import { appStore } from '../store.js';

let isTracking = false;
let checkInterval = null;
let idleStartTime = null;
let totalIdleSeconds = 0;
let onIdleCallback = null;
let onActiveCallback = null;
let isCurrentlyIdle = false;

export const idleDetector = {
  start({ onIdle, onActive } = {}) {
    if (isTracking) return;
    isTracking = true;
    idleStartTime = null;
    totalIdleSeconds = 0;
    isCurrentlyIdle = false;
    onIdleCallback = onIdle || null;
    onActiveCallback = onActive || null;

    // Check idle state every 10 seconds
    checkInterval = setInterval(() => {
      const threshold = appStore.get('settings.idleThreshold') || 300; // 5 min default
      const idleTime = powerMonitor.getSystemIdleTime(); // seconds

      if (idleTime >= threshold && !isCurrentlyIdle) {
        // User went idle
        isCurrentlyIdle = true;
        idleStartTime = new Date(Date.now() - idleTime * 1000);
        log.info(`User idle detected (${idleTime}s)`);
        onIdleCallback?.();
      } else if (idleTime < threshold && isCurrentlyIdle) {
        // User came back
        if (idleStartTime) {
          const idleDuration = Math.floor((Date.now() - idleStartTime.getTime()) / 1000);
          totalIdleSeconds += idleDuration;
        }
        isCurrentlyIdle = false;
        idleStartTime = null;
        log.info('User active again');
        onActiveCallback?.();
      }
    }, 10000);

    log.info('Idle detector started');
  },

  stop() {
    if (!isTracking) return;
    isTracking = false;
    clearInterval(checkInterval);
    checkInterval = null;

    // Flush any ongoing idle period
    if (isCurrentlyIdle && idleStartTime) {
      const idleDuration = Math.floor((Date.now() - idleStartTime.getTime()) / 1000);
      totalIdleSeconds += idleDuration;
    }

    isCurrentlyIdle = false;
    idleStartTime = null;
    log.info('Idle detector stopped');
  },

  /**
   * Collects idle time and resets for next interval.
   */
  collectAndReset() {
    let collected = totalIdleSeconds;

    // Add ongoing idle time if currently idle
    if (isCurrentlyIdle && idleStartTime) {
      collected += Math.floor((Date.now() - idleStartTime.getTime()) / 1000);
      idleStartTime = new Date(); // Reset start for ongoing idle
    }

    totalIdleSeconds = 0;
    return collected;
  },

  isIdle() {
    return isCurrentlyIdle;
  },

  isActive() {
    return isTracking;
  },
};
