import mongoose from 'mongoose';
import TimeEntry from '../models/TimeEntry.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

class TimeEntryService {
  /**
   * Start a new timer for a user.
   * Enforces single active timer — stops any existing running timer first.
   */
  async startTimer(userId, data) {
    // Auto-stop any currently running timer
    const runningEntry = await TimeEntry.findOne({
      user: userId,
      status: { $in: ['running', 'paused'] },
    });

    if (runningEntry) {
      await this.stopTimer(runningEntry._id, userId);
      logger.info(`Auto-stopped previous timer ${runningEntry._id} for user ${userId}`);
    }

    const entry = await TimeEntry.create({
      user: userId,
      description: data.description || '',
      project: data.project || null,
      task: data.task || null,
      tags: data.tags || [],
      isBillable: data.isBillable ?? true,
      entryType: 'timer',
      status: 'running',
      startTime: new Date(),
    });

    return entry;
  }

  /**
   * Stop a running/paused timer and finalize duration.
   */
  async stopTimer(entryId, userId) {
    const entry = await TimeEntry.findOne({ _id: entryId, user: userId });

    if (!entry) {
      throw ApiError.notFound('Time entry not found');
    }

    if (entry.status === 'completed') {
      throw ApiError.badRequest('This timer is already stopped');
    }

    // Close any open break
    const openBreak = entry.breaks.find((b) => !b.endedAt);
    if (openBreak) {
      openBreak.endedAt = new Date();
    }

    entry.endTime = new Date();
    entry.status = 'completed';
    entry.calculateDuration();
    entry.calculateBreakDuration();
    await entry.save();

    return entry;
  }

  /**
   * Pause a running timer — records break start time.
   */
  async pauseTimer(entryId, userId) {
    const entry = await TimeEntry.findOne({ _id: entryId, user: userId });

    if (!entry) {
      throw ApiError.notFound('Time entry not found');
    }

    if (entry.status !== 'running') {
      throw ApiError.badRequest('Only a running timer can be paused');
    }

    entry.breaks.push({ startedAt: new Date() });
    entry.status = 'paused';
    await entry.save();

    return entry;
  }

  /**
   * Resume a paused timer — records break end time.
   */
  async resumeTimer(entryId, userId) {
    const entry = await TimeEntry.findOne({ _id: entryId, user: userId });

    if (!entry) {
      throw ApiError.notFound('Time entry not found');
    }

    if (entry.status !== 'paused') {
      throw ApiError.badRequest('Only a paused timer can be resumed');
    }

    const openBreak = entry.breaks.find((b) => !b.endedAt);
    if (openBreak) {
      openBreak.endedAt = new Date();
    }

    entry.status = 'running';
    entry.calculateBreakDuration();
    await entry.save();

    return entry;
  }

  /**
   * Create a manual (completed) time entry.
   */
  async createManualEntry(userId, data) {
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    // Check for overlapping entries
    const overlap = await TimeEntry.findOne({
      user: userId,
      status: 'completed',
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
      ],
    });

    if (overlap) {
      throw ApiError.badRequest(
        'This time entry overlaps with an existing entry. Please adjust the times.'
      );
    }

    const duration = Math.floor((endTime - startTime) / 1000);

    const entry = await TimeEntry.create({
      user: userId,
      description: data.description || '',
      project: data.project || null,
      task: data.task || null,
      tags: data.tags || [],
      isBillable: data.isBillable ?? true,
      entryType: 'manual',
      status: 'completed',
      startTime,
      endTime,
      duration,
    });

    return entry;
  }

  /**
   * Update a time entry (only own entries, only completed or description/metadata on running).
   */
  async updateEntry(entryId, userId, data) {
    const entry = await TimeEntry.findOne({ _id: entryId, user: userId });

    if (!entry) {
      throw ApiError.notFound('Time entry not found');
    }

    // Allow metadata updates on any entry
    if (data.description !== undefined) entry.description = data.description;
    if (data.project !== undefined) entry.project = data.project;
    if (data.task !== undefined) entry.task = data.task;
    if (data.tags !== undefined) entry.tags = data.tags;
    if (data.isBillable !== undefined) entry.isBillable = data.isBillable;

    // Time changes only on completed entries
    if (entry.status === 'completed') {
      if (data.startTime) entry.startTime = new Date(data.startTime);
      if (data.endTime) entry.endTime = new Date(data.endTime);

      if (entry.startTime && entry.endTime) {
        if (entry.endTime <= entry.startTime) {
          throw ApiError.badRequest('End time must be after start time');
        }

        // Check for overlaps with other entries (excluding this one)
        if (data.startTime || data.endTime) {
          const overlap = await TimeEntry.findOne({
            user: userId,
            _id: { $ne: entryId },
            status: 'completed',
            startTime: { $lt: entry.endTime },
            endTime: { $gt: entry.startTime },
          });

          if (overlap) {
            throw ApiError.badRequest(
              'Updated times overlap with an existing entry. Please adjust the times.'
            );
          }
        }

        entry.calculateDuration();
      }
    } else if (data.startTime || data.endTime) {
      throw ApiError.badRequest('Cannot change times on an active timer. Stop it first.');
    }

    await entry.save();
    return entry;
  }

  /**
   * Delete a time entry (only own entries).
   */
  async deleteEntry(entryId, userId) {
    const entry = await TimeEntry.findOneAndDelete({ _id: entryId, user: userId });

    if (!entry) {
      throw ApiError.notFound('Time entry not found');
    }

    return entry;
  }

  /**
   * Get a single time entry.
   */
  async getEntry(entryId, userId) {
    const entry = await TimeEntry.findOne({ _id: entryId, user: userId })
      .populate('project', 'name color')
      .populate('task', 'title status');

    if (!entry) {
      throw ApiError.notFound('Time entry not found');
    }

    // If running, calculate live duration
    if (entry.status === 'running' || entry.status === 'paused') {
      entry.calculateDuration();
      entry.calculateBreakDuration();
    }

    return entry;
  }

  /**
   * Get the currently active timer for a user (if any).
   */
  async getActiveTimer(userId) {
    const entry = await TimeEntry.findOne({
      user: userId,
      status: { $in: ['running', 'paused'] },
    })
      .populate('project', 'name color')
      .populate('task', 'title status')
      .sort({ startTime: -1 });

    if (entry) {
      entry.calculateDuration();
      entry.calculateBreakDuration();
    }

    return entry;
  }

  /**
   * List time entries with pagination, filtering, and sorting.
   */
  async listEntries(userId, query) {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      project,
      status,
      sortBy = 'startTime',
      order = 'desc',
    } = query;

    const filter = { user: userId };

    if (status) {
      filter.status = status;
    } else {
      // Default: only completed entries in list view
      filter.status = 'completed';
    }

    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate) filter.startTime.$lte = new Date(endDate);
    }

    if (project) {
      filter.project = project;
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: order === 'asc' ? 1 : -1 };

    const [entries, total] = await Promise.all([
      TimeEntry.find(filter)
        .populate('project', 'name color')
        .populate('task', 'title status')
        .sort(sort).skip(skip).limit(limit).lean(),
      TimeEntry.countDocuments(filter),
    ]);

    return {
      entries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get summary statistics for a user within a date range.
   */
  async getSummary(userId, startDate, endDate) {
    const matchStage = {
      user: new mongoose.Types.ObjectId(userId),
      status: 'completed',
    };

    if (startDate || endDate) {
      matchStage.startTime = {};
      if (startDate) matchStage.startTime.$gte = new Date(startDate);
      if (endDate) matchStage.startTime.$lte = new Date(endDate);
    }

    const [result] = await TimeEntry.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalDuration: { $sum: '$duration' },
          totalBreaks: { $sum: '$totalBreakDuration' },
          entryCount: { $sum: 1 },
          billableSeconds: {
            $sum: {
              $cond: [
                '$isBillable',
                { $subtract: ['$duration', '$totalBreakDuration'] },
                0,
              ],
            },
          },
        },
      },
    ]);

    return {
      totalDuration: result?.totalDuration || 0,
      totalBreaks: result?.totalBreaks || 0,
      netDuration: (result?.totalDuration || 0) - (result?.totalBreaks || 0),
      entryCount: result?.entryCount || 0,
      billableSeconds: result?.billableSeconds || 0,
    };
  }

  /**
   * Get daily breakdown for a date range (for charts / weekly view).
   */
  async getDailyBreakdown(userId, startDate, endDate) {
    const result = await TimeEntry.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          status: 'completed',
          startTime: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$startTime' },
          },
          totalDuration: { $sum: '$duration' },
          totalBreaks: { $sum: '$totalBreakDuration' },
          entryCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return result.map((day) => ({
      date: day._id,
      totalDuration: day.totalDuration,
      netDuration: day.totalDuration - day.totalBreaks,
      entryCount: day.entryCount,
    }));
  }
}

const timeEntryService = new TimeEntryService();
export default timeEntryService;
