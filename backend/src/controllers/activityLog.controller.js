import activityLogService from '../services/activityLog.service.js';
import catchAsync from '../utils/catchAsync.js';
import mongoose from 'mongoose';

export const createBatch = catchAsync(async (req, res) => {
  const logs = await activityLogService.createBatch(req.user._id, req.body.logs);

  res.status(201).json({
    success: true,
    data: { count: logs.length },
  });
});

export const getByTimeEntry = catchAsync(async (req, res) => {
  const logs = await activityLogService.getByTimeEntry(
    req.user._id,
    req.params.timeEntryId
  );

  res.json({
    success: true,
    data: { logs },
  });
});

export const getSummary = catchAsync(async (req, res) => {
  const result = await activityLogService.getSummary(
    new mongoose.Types.ObjectId(req.user._id),
    req.query.startDate,
    req.query.endDate
  );

  res.json({
    success: true,
    data: result,
  });
});
