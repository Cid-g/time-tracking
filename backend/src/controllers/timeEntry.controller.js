import timeEntryService from '../services/timeEntry.service.js';
import catchAsync from '../utils/catchAsync.js';

export const startTimer = catchAsync(async (req, res) => {
  const entry = await timeEntryService.startTimer(req.user._id, req.body);

  res.status(201).json({
    success: true,
    data: { entry },
  });
});

export const stopTimer = catchAsync(async (req, res) => {
  const entry = await timeEntryService.stopTimer(req.params.id, req.user._id);

  res.json({
    success: true,
    data: { entry },
  });
});

export const pauseTimer = catchAsync(async (req, res) => {
  const entry = await timeEntryService.pauseTimer(req.params.id, req.user._id);

  res.json({
    success: true,
    data: { entry },
  });
});

export const resumeTimer = catchAsync(async (req, res) => {
  const entry = await timeEntryService.resumeTimer(req.params.id, req.user._id);

  res.json({
    success: true,
    data: { entry },
  });
});

export const createManualEntry = catchAsync(async (req, res) => {
  const entry = await timeEntryService.createManualEntry(req.user._id, req.body);

  res.status(201).json({
    success: true,
    data: { entry },
  });
});

export const updateEntry = catchAsync(async (req, res) => {
  const entry = await timeEntryService.updateEntry(req.params.id, req.user._id, req.body);

  res.json({
    success: true,
    data: { entry },
  });
});

export const deleteEntry = catchAsync(async (req, res) => {
  await timeEntryService.deleteEntry(req.params.id, req.user._id);

  res.json({
    success: true,
    message: 'Time entry deleted successfully',
  });
});

export const getEntry = catchAsync(async (req, res) => {
  const entry = await timeEntryService.getEntry(req.params.id, req.user._id);

  res.json({
    success: true,
    data: { entry },
  });
});

export const getActiveTimer = catchAsync(async (req, res) => {
  const entry = await timeEntryService.getActiveTimer(req.user._id);

  res.json({
    success: true,
    data: { entry },
  });
});

export const listEntries = catchAsync(async (req, res) => {
  const result = await timeEntryService.listEntries(req.user._id, req.query);

  res.json({
    success: true,
    data: result,
  });
});

export const getSummary = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const summary = await timeEntryService.getSummary(req.user._id, startDate, endDate);

  res.json({
    success: true,
    data: { summary },
  });
});

export const getDailyBreakdown = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const breakdown = await timeEntryService.getDailyBreakdown(req.user._id, startDate, endDate);

  res.json({
    success: true,
    data: { breakdown },
  });
});
