import path from 'path';
import fs from 'fs/promises';
import Screenshot from '../models/Screenshot.js';
import TimeEntry from '../models/TimeEntry.js';
import ApiError from '../utils/ApiError.js';

const UPLOAD_DIR = path.resolve('uploads/screenshots');

class ScreenshotService {
  /**
   * Upload a screenshot file and create a DB record.
   * @param {string} userId - Authenticated user ID
   * @param {string} timeEntryId - Associated time entry ID
   * @param {Object} file - Multer file object
   */
  async upload(userId, timeEntryId, file) {
    if (!file) {
      throw ApiError.badRequest('Screenshot file is required');
    }

    // Verify time entry belongs to the user
    const entry = await TimeEntry.findOne({ _id: timeEntryId, user: userId });
    if (!entry) {
      throw ApiError.badRequest('Invalid time entry');
    }

    // Build storage path: uploads/screenshots/{userId}/{YYYY-MM-DD}/
    const dateStr = new Date().toISOString().split('T')[0];
    const dir = path.join(UPLOAD_DIR, userId.toString(), dateStr);
    await fs.mkdir(dir, { recursive: true });

    // Move uploaded file from temp to permanent location
    const filename = `${timeEntryId}_${Date.now()}.jpg`;
    const destPath = path.join(dir, filename);
    await fs.rename(file.path, destPath);

    const screenshot = await Screenshot.create({
      user: userId,
      timeEntry: timeEntryId,
      filename,
      filePath: destPath,
      mimeType: file.mimetype || 'image/jpeg',
      sizeBytes: file.size,
      capturedAt: new Date(),
    });

    return screenshot;
  }

  /**
   * Get screenshot by ID with authorization check.
   */
  async getById(screenshotId, requestingUserId, requestingUserRole) {
    const screenshot = await Screenshot.findById(screenshotId);
    if (!screenshot) {
      throw ApiError.notFound('Screenshot not found');
    }

    // Owner or superadmin can view
    if (
      requestingUserRole !== 'superadmin' &&
      screenshot.user.toString() !== requestingUserId.toString()
    ) {
      throw ApiError.forbidden('Not authorized to view this screenshot');
    }

    return screenshot;
  }

  /**
   * Get all screenshots for a time entry.
   */
  async getByTimeEntry(timeEntryId, requestingUserId, requestingUserRole) {
    const entry = await TimeEntry.findById(timeEntryId);
    if (!entry) {
      throw ApiError.notFound('Time entry not found');
    }

    if (
      requestingUserRole !== 'superadmin' &&
      entry.user.toString() !== requestingUserId.toString()
    ) {
      throw ApiError.forbidden('Not authorized to view these screenshots');
    }

    return Screenshot.find({ timeEntry: timeEntryId }).sort({ capturedAt: 1 });
  }
}

const screenshotService = new ScreenshotService();
export default screenshotService;
