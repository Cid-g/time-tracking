import ActivityLog from '../models/ActivityLog.js';
import TimeEntry from '../models/TimeEntry.js';
import ApiError from '../utils/ApiError.js';

class ActivityLogService {
  async createBatch(userId, logs) {
    // Validate all referenced time entries belong to the user
    const timeEntryIds = [...new Set(logs.map((l) => l.timeEntry))];
    const entries = await TimeEntry.find({
      _id: { $in: timeEntryIds },
      user: userId,
    }).select('_id');

    const validIds = new Set(entries.map((e) => e._id.toString()));
    const invalidIds = timeEntryIds.filter((id) => !validIds.has(id));

    if (invalidIds.length > 0) {
      throw ApiError.badRequest(`Invalid time entry IDs: ${invalidIds.join(', ')}`);
    }

    const docs = logs.map((log) => ({
      ...log,
      user: userId,
    }));

    const inserted = await ActivityLog.insertMany(docs);
    return inserted;
  }

  async getByTimeEntry(userId, timeEntryId) {
    // Verify time entry belongs to user
    const entry = await TimeEntry.findOne({ _id: timeEntryId, user: userId });
    if (!entry) {
      throw ApiError.notFound('Time entry not found');
    }

    const logs = await ActivityLog.find({
      user: userId,
      timeEntry: timeEntryId,
    }).sort({ intervalStart: 1 });

    return logs;
  }

  async getSummary(userId, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const result = await ActivityLog.aggregate([
      {
        $match: {
          user: userId,
          intervalStart: { $gte: start },
          intervalEnd: { $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalIntervals: { $sum: 1 },
          avgMouseActivity: { $avg: '$mouseActivity' },
          avgKeyboardActivity: { $avg: '$keyboardActivity' },
          avgOverallActivity: { $avg: '$overallActivity' },
          totalIdleTime: { $sum: '$idleTime' },
          totalDuration: { $sum: '$intervalDuration' },
        },
      },
      {
        $project: {
          _id: 0,
          totalIntervals: 1,
          avgMouseActivity: { $round: ['$avgMouseActivity', 1] },
          avgKeyboardActivity: { $round: ['$avgKeyboardActivity', 1] },
          avgOverallActivity: { $round: ['$avgOverallActivity', 1] },
          totalIdleTime: 1,
          totalDuration: 1,
        },
      },
    ]);

    // Top apps aggregation
    const topApps = await ActivityLog.aggregate([
      {
        $match: {
          user: userId,
          intervalStart: { $gte: start },
          intervalEnd: { $lte: end },
        },
      },
      { $unwind: '$activeWindows' },
      {
        $group: {
          _id: '$activeWindows.appName',
          totalDuration: { $sum: '$activeWindows.duration' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalDuration: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          appName: '$_id',
          totalDuration: 1,
          count: 1,
        },
      },
    ]);

    return {
      summary: result[0] || {
        totalIntervals: 0,
        avgMouseActivity: 0,
        avgKeyboardActivity: 0,
        avgOverallActivity: 0,
        totalIdleTime: 0,
        totalDuration: 0,
      },
      topApps,
    };
  }
}

const activityLogService = new ActivityLogService();
export default activityLogService;
