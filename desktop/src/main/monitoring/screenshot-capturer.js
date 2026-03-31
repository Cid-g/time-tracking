import { desktopCapturer, app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import log from 'electron-log';
import { appStore } from '../store.js';

const MAX_WIDTH = 1920;
const RETENTION_DAYS = 30;

let lastScreenshotPath = null;

/**
 * ScreenshotCapturer — captures screen at configured quality,
 * saves locally for sync, and manages local retention.
 */
export const screenshotCapturer = {
  /**
   * Capture the primary screen as a compressed JPEG.
   * @param {string} userId - User ID for directory naming
   * @returns {Object|null} { filePath, filename, sizeBytes } or null on failure
   */
  async capture(userId) {
    if (!userId) {
      log.warn('ScreenshotCapturer: No userId provided');
      return null;
    }

    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: MAX_WIDTH, height: MAX_WIDTH },
      });

      if (!sources || sources.length === 0) {
        log.warn('ScreenshotCapturer: No screen sources found');
        return null;
      }

      // Use primary display (first source)
      const primarySource = sources[0];
      const image = primarySource.thumbnail;

      if (image.isEmpty()) {
        log.warn('ScreenshotCapturer: Captured empty image');
        return null;
      }

      // Compress to JPEG
      const quality = appStore.get('settings.screenshotQuality') || 65;
      const jpegBuffer = image.toJPEG(quality);

      // Build local storage path: {userData}/screenshots/{userId}/{YYYY-MM-DD}/
      const dateStr = new Date().toISOString().split('T')[0];
      const dir = path.join(app.getPath('userData'), 'screenshots', userId, dateStr);
      await fs.mkdir(dir, { recursive: true });

      const filename = `screenshot_${Date.now()}.jpg`;
      const filePath = path.join(dir, filename);

      await fs.writeFile(filePath, jpegBuffer);

      lastScreenshotPath = filePath;
      const fileSizeKb = Math.round(jpegBuffer.length / 1024);
      log.info(`Screenshot captured: ${filename} (${fileSizeKb} KB)`);

      return { filePath, filename, sizeBytes: jpegBuffer.length };
    } catch (err) {
      log.error('ScreenshotCapturer: Capture failed:', err.message);
      return null;
    }
  },

  getLastPath() {
    return lastScreenshotPath;
  },

  /**
   * Delete local screenshots older than RETENTION_DAYS.
   * Safe to call on app startup.
   */
  async cleanupOldScreenshots(userId) {
    if (!userId) return;

    const baseDir = path.join(app.getPath('userData'), 'screenshots', userId);
    try {
      const dateDirs = await fs.readdir(baseDir);
      const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
      let cleaned = 0;

      for (const dateDir of dateDirs) {
        const dirDate = new Date(dateDir);
        if (!isNaN(dirDate.getTime()) && dirDate.getTime() < cutoff) {
          await fs.rm(path.join(baseDir, dateDir), { recursive: true, force: true });
          cleaned++;
        }
      }

      if (cleaned > 0) {
        log.info(`Screenshot cleanup: removed ${cleaned} old directories`);
      }
    } catch (err) {
      if (err.code !== 'ENOENT') {
        log.error('Screenshot cleanup error:', err.message);
      }
    }
  },
};
