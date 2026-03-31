import log from 'electron-log';
import fs from 'fs';
import { apiClient } from '../api.js';
import { monitorManager } from '../monitoring/monitor-manager.js';
import { offlineQueue } from './offline-queue.js';
import { appStore } from '../store.js';

let syncInterval = null;
let retryTimeout = null;
let retryCount = 0;
const MAX_RETRY = 5;
const BATCH_SIZE = 50;

/**
 * Upload screenshots for snapshots that have a local screenshot path.
 * On success, sets snapshot.screenshot to the backend screenshot ID.
 * On failure, logs and continues — activity log is still sent without screenshot.
 */
async function uploadScreenshots(snapshots) {
  for (const snapshot of snapshots) {
    if (!snapshot._screenshotPath) continue;

    try {
      // Verify file still exists before uploading
      if (fs.existsSync(snapshot._screenshotPath)) {
        const screenshotId = await apiClient.uploadScreenshot(
          snapshot._screenshotPath,
          snapshot.timeEntry
        );
        snapshot.screenshot = screenshotId;
        log.info(`Screenshot uploaded: ${screenshotId}`);
      } else {
        log.warn(`Screenshot file missing, skipping: ${snapshot._screenshotPath}`);
      }
    } catch (err) {
      log.error('Screenshot upload failed:', err.message);
      // Continue without screenshot — activity data is more important
    }

    // Always strip the local-only field before sending to backend
    delete snapshot._screenshotPath;
  }
}

async function sendBatch(snapshots) {
  if (!snapshots || snapshots.length === 0) return true;

  // Send in batches of BATCH_SIZE
  for (let i = 0; i < snapshots.length; i += BATCH_SIZE) {
    const batch = snapshots.slice(i, i + BATCH_SIZE);
    try {
      await apiClient.batchCreateActivityLogs(batch);
      log.info(`Synced batch of ${batch.length} activity logs`);
    } catch (err) {
      log.error(`Sync failed at batch ${i / BATCH_SIZE + 1}:`, err.message);
      // Re-queue unsent items
      const remaining = snapshots.slice(i);
      offlineQueue.enqueue(remaining);
      return false;
    }
  }
  return true;
}

async function syncCycle() {
  // 1. Flush pending snapshots from monitor
  const fresh = monitorManager.flushSnapshots();

  // 2. Get any queued offline data
  const queued = offlineQueue.dequeueAll();

  const allData = [...queued, ...fresh];
  if (allData.length === 0) return;

  log.info(`Sync cycle: ${fresh.length} new + ${queued.length} queued = ${allData.length} total`);

  // 3. Upload screenshots before sending activity batch
  await uploadScreenshots(allData);

  // 4. Send activity logs
  const success = await sendBatch(allData);
  if (success) {
    retryCount = 0;
  } else {
    retryCount++;
    if (retryCount <= MAX_RETRY) {
      const delay = Math.min(30000, 1000 * Math.pow(2, retryCount));
      log.warn(`Sync failed, retry ${retryCount}/${MAX_RETRY} in ${delay / 1000}s`);
      retryTimeout = setTimeout(syncCycle, delay);
    } else {
      log.error('Max sync retries reached, data queued offline');
      retryCount = 0;
    }
  }
}

export const syncManager = {
  start() {
    const intervalMs = (appStore.get('settings.monitoringInterval') || 600) * 1000;

    // Sync at the same interval as monitoring
    syncInterval = setInterval(syncCycle, intervalMs);

    // Also try to drain offline queue on start
    const queueSize = offlineQueue.size();
    if (queueSize > 0) {
      log.info(`Draining offline queue: ${queueSize} items`);
      syncCycle();
    }

    log.info(`SyncManager started, interval: ${intervalMs / 1000}s`);
  },

  stop() {
    clearInterval(syncInterval);
    clearTimeout(retryTimeout);
    syncInterval = null;
    retryTimeout = null;

    // Final sync — flush everything
    syncCycle();

    log.info('SyncManager stopped');
  },

  /**
   * Force an immediate sync cycle.
   */
  async forceSync() {
    await syncCycle();
  },

  getQueueSize() {
    return offlineQueue.size();
  },
};
