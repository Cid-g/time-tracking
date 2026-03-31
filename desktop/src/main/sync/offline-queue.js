import log from 'electron-log';
import { appStore } from '../store.js';

const MAX_QUEUE_SIZE = 1000;

export const offlineQueue = {
  enqueue(snapshots) {
    if (!snapshots || snapshots.length === 0) return;

    const queue = appStore.get('offlineQueue') || [];
    const combined = [...queue, ...snapshots];

    // Trim if over max size (keep newest)
    const trimmed = combined.length > MAX_QUEUE_SIZE
      ? combined.slice(combined.length - MAX_QUEUE_SIZE)
      : combined;

    appStore.set('offlineQueue', trimmed);
    log.info(`Offline queue: added ${snapshots.length}, total: ${trimmed.length}`);
  },

  dequeueAll() {
    const queue = appStore.get('offlineQueue') || [];
    appStore.set('offlineQueue', []);
    return queue;
  },

  peek() {
    return appStore.get('offlineQueue') || [];
  },

  size() {
    return (appStore.get('offlineQueue') || []).length;
  },

  clear() {
    appStore.set('offlineQueue', []);
  },
};
