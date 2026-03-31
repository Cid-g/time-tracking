import path from 'path';
import fs from 'fs/promises';
import screenshotService from '../services/screenshot.service.js';
import catchAsync from '../utils/catchAsync.js';

export const upload = catchAsync(async (req, res) => {
  const screenshot = await screenshotService.upload(
    req.user._id,
    req.body.timeEntry,
    req.file
  );

  res.status(201).json({
    success: true,
    data: { screenshotId: screenshot._id },
  });
});

export const getById = catchAsync(async (req, res) => {
  const screenshot = await screenshotService.getById(
    req.params.id,
    req.user._id,
    req.user.role
  );

  // Serve the actual image file
  try {
    await fs.access(screenshot.filePath);
  } catch {
    return res.status(404).json({
      success: false,
      message: 'Screenshot file not found on disk',
    });
  }

  res.setHeader('Content-Type', screenshot.mimeType);
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.sendFile(path.resolve(screenshot.filePath));
});

export const getByTimeEntry = catchAsync(async (req, res) => {
  const screenshots = await screenshotService.getByTimeEntry(
    req.params.timeEntryId,
    req.user._id,
    req.user.role
  );

  res.json({
    success: true,
    data: { screenshots },
  });
});
