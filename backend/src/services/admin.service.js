import mongoose from 'mongoose';
import TimeEntry from '../models/TimeEntry.js';
import Submission from '../models/Submission.js';
import AuditLog from '../models/AuditLog.js';
import ActivityLog from '../models/ActivityLog.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import ApiError from '../utils/ApiError.js';

class AdminService {
  // =============================================
  // Module 25: Timesheet Explorer
  // =============================================

  async getTimesheets(query) {
    const {
      page = 1,
      limit = 25,
      userId,
      projectId,
      startDate,
      endDate,
      status,
      search,
      sort = 'startTime',
      order = 'desc',
    } = query;

    const filter = {};

    if (userId) filter.user = userId;
    if (projectId) filter.project = projectId;
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate) filter.startTime.$lte = new Date(endDate);
    }

    // Search by description
    if (search) {
      filter.description = { $regex: search, $options: 'i' };
    }

    const sortObj = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;

    const [entries, total] = await Promise.all([
      TimeEntry.find(filter)
        .populate('user', 'firstName lastName email role')
        .populate('project', 'name color')
        .populate('task', 'title status')
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
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

  async editTimeEntry(entryId, adminId, updates, reason) {
    const entry = await TimeEntry.findById(entryId);
    if (!entry) {
      throw ApiError.notFound('Time entry not found');
    }

    // Snapshot before state
    const before = {
      description: entry.description,
      startTime: entry.startTime,
      endTime: entry.endTime,
      duration: entry.duration,
      project: entry.project,
      task: entry.task,
      isBillable: entry.isBillable,
    };

    // Apply updates
    if (updates.description !== undefined) entry.description = updates.description;
    if (updates.startTime !== undefined) entry.startTime = new Date(updates.startTime);
    if (updates.endTime !== undefined) entry.endTime = new Date(updates.endTime);
    if (updates.project !== undefined) entry.project = updates.project;
    if (updates.task !== undefined) entry.task = updates.task;
    if (updates.isBillable !== undefined) entry.isBillable = updates.isBillable;

    // Recalculate duration if times changed
    if (updates.startTime || updates.endTime) {
      if (entry.startTime && entry.endTime) {
        entry.duration = Math.floor((entry.endTime - entry.startTime) / 1000);
        entry.calculateBreakDuration();
      }
    }

    await entry.save();

    // Snapshot after state
    const after = {
      description: entry.description,
      startTime: entry.startTime,
      endTime: entry.endTime,
      duration: entry.duration,
      project: entry.project,
      task: entry.task,
      isBillable: entry.isBillable,
    };

    // Create audit log
    await this._createAuditEntry(adminId, 'ADMIN_TIME_ENTRY_EDITED', {
      type: 'TimeEntry',
      id: entry._id,
      before,
      after,
      reason,
    });

    return entry;
  }

  async exportTimesheets(query) {
    const { format = 'csv', userId, projectId, startDate, endDate } = query;

    const filter = {};
    if (userId) filter.user = userId;
    if (projectId) filter.project = projectId;
    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate) filter.startTime.$lte = new Date(endDate);
    }

    const entries = await TimeEntry.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('project', 'name')
      .populate('task', 'title')
      .sort({ startTime: -1 })
      .lean();

    if (format === 'json') {
      return entries;
    }

    // CSV format
    const headers = ['Date', 'User', 'Email', 'Project', 'Task', 'Description', 'Hours', 'Billable', 'Status'];
    const rows = entries.map((e) => [
      e.startTime ? new Date(e.startTime).toISOString().split('T')[0] : '',
      e.user ? `${e.user.firstName} ${e.user.lastName}` : '',
      e.user ? e.user.email : '',
      e.project ? e.project.name : 'No Project',
      e.task ? e.task.title : '',
      `"${(e.description || '').replace(/"/g, '""')}"`,
      (e.duration / 3600).toFixed(2),
      e.isBillable ? 'Yes' : 'No',
      e.status,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  async runComplianceCheck(data) {
    const { startDate, endDate, userId, maxDailyHours = 8, flagWeekends = true } = data;
    const maxDailySeconds = maxDailyHours * 3600;

    const matchStage = {
      startTime: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
      status: 'completed',
    };

    if (userId) {
      matchStage.user = new mongoose.Types.ObjectId(userId);
    }

    // Group by user + date, sum durations
    const dailyTotals = await TimeEntry.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            user: '$user',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
          },
          totalDuration: { $sum: '$duration' },
          entryCount: { $sum: 1 },
          dayOfWeek: { $first: { $dayOfWeek: '$startTime' } },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id.user',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          date: '$_id.date',
          userId: '$_id.user',
          userName: { $concat: ['$userInfo.firstName', ' ', '$userInfo.lastName'] },
          userEmail: '$userInfo.email',
          totalDuration: 1,
          entryCount: 1,
          dayOfWeek: 1,
          isOvertime: { $gt: ['$totalDuration', maxDailySeconds] },
          isWeekend: { $in: ['$dayOfWeek', [1, 7]] }, // Sunday=1, Saturday=7
        },
      },
      { $sort: { totalDuration: -1 } },
    ]);

    // Filter violations
    const violations = dailyTotals.filter(
      (d) => d.isOvertime || (flagWeekends && d.isWeekend)
    );

    const overtimeViolations = violations.filter((v) => v.isOvertime);
    const weekendViolations = violations.filter((v) => v.isWeekend);
    const usersAffected = new Set(violations.map((v) => v.userId.toString())).size;

    return {
      violations,
      summary: {
        totalViolations: violations.length,
        overtimeCount: overtimeViolations.length,
        weekendCount: weekendViolations.length,
        usersAffected,
        dateRange: { startDate, endDate },
        policy: { maxDailyHours, flagWeekends },
      },
    };
  }

  async bulkTimesheetAction(adminId, action, entryIds, reason) {
    const entries = await TimeEntry.find({ _id: { $in: entryIds } });

    if (entries.length === 0) {
      throw ApiError.notFound('No matching time entries found');
    }

    let modified = 0;

    for (const entry of entries) {
      if (action === 'flag') {
        if (!entry.tags.includes('flagged')) {
          entry.tags.push('flagged');
          await entry.save();
          modified++;
        }
      } else if (action === 'unflag') {
        const idx = entry.tags.indexOf('flagged');
        if (idx !== -1) {
          entry.tags.splice(idx, 1);
          await entry.save();
          modified++;
        }
      }
    }

    // Log bulk action
    await this._createAuditEntry(adminId, 'ADMIN_BULK_ACTION', {
      type: 'TimeEntry',
      id: null,
      before: null,
      after: { action, entryIds, modified },
      reason,
    });

    return { action, requested: entryIds.length, modified };
  }

  // =============================================
  // Module 26: Approvals Hub
  // =============================================

  async getApprovals(query) {
    const {
      page = 1,
      limit = 20,
      status,
      userId,
      startDate,
      endDate,
      sort = 'submittedAt',
    } = query;

    const filter = {};

    if (status) {
      filter.status = status;
    } else {
      // By default exclude drafts for the admin view
      filter.status = { $ne: 'draft' };
    }

    if (userId) filter.user = userId;

    if (startDate || endDate) {
      filter.submittedAt = {};
      if (startDate) filter.submittedAt.$gte = new Date(startDate);
      if (endDate) filter.submittedAt.$lte = new Date(endDate);
    }

    const sortObj = {};
    sortObj[sort] = -1;

    const [submissions, total] = await Promise.all([
      Submission.find(filter)
        .populate('user', 'firstName lastName email role')
        .populate('projectBreakdown.project', 'name color')
        .populate('reviewedBy', 'firstName lastName email')
        .populate('approvalChain.user', 'firstName lastName')
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Submission.countDocuments(filter),
    ]);

    return {
      submissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async bulkApprovalAction(adminId, action, submissionIds, comment) {
    const submissions = await Submission.find({
      _id: { $in: submissionIds },
      status: 'submitted',
    });

    if (submissions.length === 0) {
      throw ApiError.badRequest('No eligible submissions found (must be in "submitted" status)');
    }

    const results = [];
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    for (const submission of submissions) {
      submission.status = newStatus;
      submission.reviewedAt = new Date();
      submission.reviewedBy = adminId;
      submission.version += 1;
      submission.approvalChain.push({
        user: adminId,
        action: newStatus === 'approved' ? 'approved' : 'rejected',
        comment: comment || '',
        timestamp: new Date(),
      });

      await submission.save();
      results.push({ id: submission._id, status: newStatus });

      // Create audit log for each
      await this._createAuditEntry(adminId, newStatus === 'approved' ? 'SUBMISSION_APPROVED' : 'SUBMISSION_REJECTED', {
        type: 'Submission',
        id: submission._id,
        before: { status: 'submitted' },
        after: { status: newStatus, comment },
      });
    }

    return {
      action,
      requested: submissionIds.length,
      processed: results.length,
      results,
    };
  }

  async delegateApproval(submissionId, adminId, delegateToId, comment) {
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      throw ApiError.notFound('Submission not found');
    }

    if (submission.status !== 'submitted') {
      throw ApiError.badRequest('Only submitted timesheets can be delegated');
    }

    // Verify delegate is a valid manager or superadmin
    const delegate = await User.findById(delegateToId);
    if (!delegate) {
      throw ApiError.notFound('Delegate user not found');
    }
    if (!['manager', 'superadmin'].includes(delegate.role)) {
      throw ApiError.badRequest('Can only delegate to managers or superadmins');
    }

    // Record delegation in approval chain
    submission.approvalChain.push({
      user: adminId,
      action: 'delegated',
      comment: comment ? `Delegated to ${delegate.firstName} ${delegate.lastName}: ${comment}` : `Delegated to ${delegate.firstName} ${delegate.lastName}`,
      timestamp: new Date(),
    });
    submission.version += 1;

    await submission.save();

    // Create audit log
    await this._createAuditEntry(adminId, 'ADMIN_DELEGATION', {
      type: 'Submission',
      id: submission._id,
      before: null,
      after: { delegatedTo: delegateToId, delegateName: `${delegate.firstName} ${delegate.lastName}` },
      reason: comment,
    });

    return submission;
  }

  async getApprovalHistory(query) {
    const { page = 1, limit = 20, startDate, endDate } = query;

    const filter = {
      action: {
        $in: [
          'SUBMISSION_APPROVED',
          'SUBMISSION_REJECTED',
          'SUBMISSION_DELEGATED',
          'ADMIN_BULK_ACTION',
          'ADMIN_DELEGATION',
        ],
      },
    };

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // =============================================
  // Module 27: Audit Trail
  // =============================================

  async getAuditLogs(query) {
    const { page = 1, limit = 25, action, userId, targetType, startDate, endDate } = query;

    const filter = {};

    if (action) filter.action = action;
    if (userId) filter.user = userId;
    if (targetType) filter['target.type'] = targetType;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getAuditLogDetail(logId) {
    const log = await AuditLog.findById(logId)
      .populate('user', 'firstName lastName email role')
      .lean();

    if (!log) {
      throw ApiError.notFound('Audit log entry not found');
    }

    return log;
  }

  async exportAuditLogs(query) {
    const { format = 'csv', action, userId, startDate, endDate } = query;

    const filter = {};
    if (action) filter.action = action;
    if (userId) filter.user = userId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(filter)
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    if (format === 'json') {
      return logs;
    }

    // CSV format
    const headers = ['Timestamp', 'Action', 'User', 'Email', 'Target Type', 'Target ID', 'IP Address', 'Details'];
    const rows = logs.map((l) => [
      l.createdAt ? new Date(l.createdAt).toISOString() : '',
      l.action,
      l.user ? `${l.user.firstName} ${l.user.lastName}` : 'System',
      l.user ? l.user.email : '',
      l.target?.type || '',
      l.target?.id || '',
      l.ipAddress || '',
      `"${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  async detectAnomalies(query) {
    const { startDate, endDate, failedLoginThreshold = 5, massDeletionThreshold = 10 } = query;

    const dateFilter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    const [failedLogins, massEdits, offHoursActivity] = await Promise.all([
      // 1. Frequent failed logins
      AuditLog.aggregate([
        { $match: { ...dateFilter, action: 'LOGIN_FAILED' } },
        {
          $group: {
            _id: { user: '$user', ip: '$ipAddress' },
            count: { $sum: 1 },
            lastAttempt: { $max: '$createdAt' },
          },
        },
        { $match: { count: { $gte: failedLoginThreshold } } },
        {
          $lookup: {
            from: 'users',
            localField: '_id.user',
            foreignField: '_id',
            as: 'userInfo',
          },
        },
        { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            category: { $literal: 'failed_login' },
            severity: 'high',
            count: 1,
            lastAttempt: 1,
            ip: '$_id.ip',
            userName: {
              $cond: [
                '$userInfo',
                { $concat: ['$userInfo.firstName', ' ', '$userInfo.lastName'] },
                'Unknown',
              ],
            },
            userEmail: { $ifNull: ['$userInfo.email', 'Unknown'] },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // 2. Mass edits/deletions by a single user
      AuditLog.aggregate([
        {
          $match: {
            ...dateFilter,
            action: {
              $in: ['TIME_ENTRY_DELETED', 'ADMIN_TIME_ENTRY_EDITED', 'ADMIN_BULK_ACTION'],
            },
          },
        },
        {
          $group: {
            _id: '$user',
            count: { $sum: 1 },
            lastAction: { $max: '$createdAt' },
            actions: { $push: '$action' },
          },
        },
        { $match: { count: { $gte: massDeletionThreshold } } },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo',
          },
        },
        { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            category: { $literal: 'mass_modification' },
            severity: 'medium',
            count: 1,
            lastAction: 1,
            userName: {
              $cond: [
                '$userInfo',
                { $concat: ['$userInfo.firstName', ' ', '$userInfo.lastName'] },
                'Unknown',
              ],
            },
            userEmail: { $ifNull: ['$userInfo.email', 'Unknown'] },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // 3. Off-hours activity (entries started before 6 AM or after 10 PM)
      TimeEntry.aggregate([
        {
          $match: {
            startTime: {
              $gte: new Date(startDate),
              $lte: new Date(endDate),
            },
            status: 'completed',
          },
        },
        {
          $project: {
            user: 1,
            startTime: 1,
            hour: { $hour: '$startTime' },
          },
        },
        { $match: { $or: [{ hour: { $lt: 6 } }, { hour: { $gte: 22 } }] } },
        {
          $group: {
            _id: '$user',
            count: { $sum: 1 },
            entries: { $push: { startTime: '$startTime', hour: '$hour' } },
          },
        },
        { $match: { count: { $gte: 3 } } },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo',
          },
        },
        { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            category: { $literal: 'off_hours' },
            severity: 'low',
            count: 1,
            userName: {
              $cond: [
                '$userInfo',
                { $concat: ['$userInfo.firstName', ' ', '$userInfo.lastName'] },
                'Unknown',
              ],
            },
            userEmail: { $ifNull: ['$userInfo.email', 'Unknown'] },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    const allAnomalies = [...failedLogins, ...massEdits, ...offHoursActivity];

    return {
      anomalies: allAnomalies,
      summary: {
        total: allAnomalies.length,
        failedLogins: failedLogins.length,
        massModifications: massEdits.length,
        offHoursActivity: offHoursActivity.length,
        dateRange: { startDate, endDate },
      },
    };
  }

  // =============================================
  // Module 28: Productivity Trends
  // =============================================

  async getProductivityTrends(query) {
    const { startDate, endDate, userId, projectId, groupBy = 'user', hourlyRate = 0 } = query;

    const matchStage = {
      status: 'completed',
      startTime: { $gte: new Date(startDate), $lte: new Date(endDate) },
    };
    if (userId) matchStage.user = new mongoose.Types.ObjectId(userId);
    if (projectId) matchStage.project = new mongoose.Types.ObjectId(projectId);

    let groupId;
    if (groupBy === 'user') groupId = '$user';
    else if (groupBy === 'project') groupId = '$project';
    else groupId = { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } };

    const [trendData, dailyStats, overtimeData] = await Promise.all([
      // Main aggregation by groupBy
      TimeEntry.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: groupId,
            totalDuration: { $sum: '$duration' },
            totalBreakDuration: { $sum: '$totalBreakDuration' },
            entryCount: { $sum: 1 },
            billableSeconds: { $sum: { $cond: ['$isBillable', '$duration', 0] } },
            uniqueDays: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } } },
          },
        },
        ...(groupBy === 'user'
          ? [
              { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'info' } },
              { $unwind: { path: '$info', preserveNullAndEmptyArrays: true } },
              {
                $project: {
                  name: { $concat: ['$info.firstName', ' ', '$info.lastName'] },
                  email: '$info.email',
                  totalDuration: 1, totalBreakDuration: 1, entryCount: 1, billableSeconds: 1,
                  daysWorked: { $size: '$uniqueDays' },
                },
              },
            ]
          : groupBy === 'project'
          ? [
              { $lookup: { from: 'projects', localField: '_id', foreignField: '_id', as: 'info' } },
              { $unwind: { path: '$info', preserveNullAndEmptyArrays: true } },
              {
                $project: {
                  name: { $ifNull: ['$info.name', 'No Project'] },
                  color: '$info.color',
                  totalDuration: 1, totalBreakDuration: 1, entryCount: 1, billableSeconds: 1,
                  daysWorked: { $size: '$uniqueDays' },
                },
              },
            ]
          : [
              {
                $project: {
                  date: '$_id',
                  totalDuration: 1, totalBreakDuration: 1, entryCount: 1, billableSeconds: 1,
                  daysWorked: { $literal: 1 },
                },
              },
            ]),
        { $sort: { totalDuration: -1 } },
      ]),

      // Daily averages
      TimeEntry.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
            totalDuration: { $sum: '$duration' },
            activeUsers: { $addToSet: '$user' },
          },
        },
      ]),

      // Overtime detection (>8h in a single day)
      TimeEntry.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { user: '$user', date: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } } },
            dailyTotal: { $sum: '$duration' },
          },
        },
        { $match: { dailyTotal: { $gt: 8 * 3600 } } },
        { $lookup: { from: 'users', localField: '_id.user', foreignField: '_id', as: 'userInfo' } },
        { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            date: '$_id.date',
            userId: '$_id.user',
            userName: { $concat: ['$userInfo.firstName', ' ', '$userInfo.lastName'] },
            dailyTotal: 1,
            overtimeSeconds: { $subtract: ['$dailyTotal', 8 * 3600] },
          },
        },
        { $sort: { dailyTotal: -1 } },
        { $limit: 50 },
      ]),
    ]);

    const totalSeconds = trendData.reduce((s, t) => s + t.totalDuration, 0);
    const totalBillableSeconds = trendData.reduce((s, t) => s + t.billableSeconds, 0);
    const avgDailyHours = dailyStats.length > 0 ? totalSeconds / dailyStats.length / 3600 : 0;

    return {
      trends: trendData,
      overtime: overtimeData,
      summary: {
        totalHours: +(totalSeconds / 3600).toFixed(2),
        totalBillableHours: +(totalBillableSeconds / 3600).toFixed(2),
        avgDailyHours: +avgDailyHours.toFixed(2),
        totalEntries: trendData.reduce((s, t) => s + t.entryCount, 0),
        overtimeIncidents: overtimeData.length,
        estimatedCost: hourlyRate > 0 ? +(totalBillableSeconds / 3600 * hourlyRate).toFixed(2) : null,
        dateRange: { startDate, endDate },
      },
    };
  }

  async exportProductivityTrends(query) {
    const { format = 'csv' } = query;
    const result = await this.getProductivityTrends(query);

    if (format === 'json') return result;

    const headers = ['Name', 'Total Hours', 'Billable Hours', 'Entries', 'Days Worked', 'Avg Daily Hours'];
    const rows = result.trends.map((t) => [
      `"${(t.name || t.date || 'Unknown').replace(/"/g, '""')}"`,
      (t.totalDuration / 3600).toFixed(2),
      (t.billableSeconds / 3600).toFixed(2),
      t.entryCount,
      t.daysWorked,
      t.daysWorked > 0 ? (t.totalDuration / t.daysWorked / 3600).toFixed(2) : '0.00',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  // =============================================
  // Module 29: Activity Levels
  // =============================================

  async getActivityLevels(query) {
    const { startDate, endDate, userId, minActivity, maxActivity } = query;

    const matchStage = {
      intervalStart: { $gte: new Date(startDate), $lte: new Date(endDate) },
    };
    if (userId) matchStage.user = new mongoose.Types.ObjectId(userId);
    if (minActivity !== undefined) matchStage.overallActivity = { ...matchStage.overallActivity, $gte: minActivity };
    if (maxActivity !== undefined) matchStage.overallActivity = { ...matchStage.overallActivity, $lte: maxActivity };

    const [perUserActivity, levelDistribution, idleAnalysis] = await Promise.all([
      // Per-user breakdown
      ActivityLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$user',
            avgMouse: { $avg: '$mouseActivity' },
            avgKeyboard: { $avg: '$keyboardActivity' },
            avgOverall: { $avg: '$overallActivity' },
            totalIdleTime: { $sum: '$idleTime' },
            totalIntervals: { $sum: 1 },
            totalDuration: { $sum: '$intervalDuration' },
          },
        },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
        { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            userId: '$_id',
            name: { $concat: ['$userInfo.firstName', ' ', '$userInfo.lastName'] },
            email: '$userInfo.email',
            avgMouse: { $round: ['$avgMouse', 1] },
            avgKeyboard: { $round: ['$avgKeyboard', 1] },
            avgOverall: { $round: ['$avgOverall', 1] },
            totalIdleTime: 1,
            totalIntervals: 1,
            totalDuration: 1,
            idlePercentage: {
              $round: [
                { $multiply: [{ $cond: [{ $gt: ['$totalDuration', 0] }, { $divide: ['$totalIdleTime', '$totalDuration'] }, 0] }, 100] },
                1,
              ],
            },
          },
        },
        { $sort: { avgOverall: -1 } },
      ]),

      // Activity level distribution buckets
      ActivityLog.aggregate([
        { $match: matchStage },
        {
          $bucket: {
            groupBy: '$overallActivity',
            boundaries: [0, 20, 50, 75, 101],
            default: 'other',
            output: { count: { $sum: 1 }, avgActivity: { $avg: '$overallActivity' } },
          },
        },
      ]),

      // Idle time analysis by day
      ActivityLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$intervalStart' } },
            avgOverall: { $avg: '$overallActivity' },
            totalIdleTime: { $sum: '$idleTime' },
            totalDuration: { $sum: '$intervalDuration' },
            intervals: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const bucketLabels = { 0: 'Idle (0-20%)', 20: 'Low (20-50%)', 50: 'Medium (50-75%)', 75: 'High (75-100%)' };
    const distribution = levelDistribution.map((b) => ({
      label: bucketLabels[b._id] || 'Other',
      count: b.count,
      avgActivity: +(b.avgActivity || 0).toFixed(1),
    }));

    const totalIntervals = perUserActivity.reduce((s, u) => s + u.totalIntervals, 0);
    const overallAvg = perUserActivity.length > 0
      ? +(perUserActivity.reduce((s, u) => s + u.avgOverall, 0) / perUserActivity.length).toFixed(1)
      : 0;

    return {
      users: perUserActivity,
      distribution,
      dailyTrend: idleAnalysis,
      summary: {
        totalIntervals,
        avgOverallActivity: overallAvg,
        usersTracked: perUserActivity.length,
        dateRange: { startDate, endDate },
      },
    };
  }

  async getActivityHeatmap(query) {
    const { startDate, endDate, userId } = query;

    const matchStage = {
      intervalStart: { $gte: new Date(startDate), $lte: new Date(endDate) },
    };
    if (userId) matchStage.user = new mongoose.Types.ObjectId(userId);

    const heatmapData = await ActivityLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            dayOfWeek: { $dayOfWeek: '$intervalStart' },
            hour: { $hour: '$intervalStart' },
          },
          avgActivity: { $avg: '$overallActivity' },
          intervalCount: { $sum: 1 },
        },
      },
      {
        $project: {
          dayOfWeek: '$_id.dayOfWeek',
          hour: '$_id.hour',
          avgActivity: { $round: ['$avgActivity', 1] },
          intervalCount: 1,
        },
      },
      { $sort: { dayOfWeek: 1, hour: 1 } },
    ]);

    // Build 7x24 grid (0=Sun, 6=Sat)
    const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
    const counts = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const item of heatmapData) {
      const dayIdx = item.dayOfWeek - 1;
      grid[dayIdx][item.hour] = item.avgActivity;
      counts[dayIdx][item.hour] = item.intervalCount;
    }

    return { grid, counts, raw: heatmapData };
  }

  // =============================================
  // Module 30: App & Website Usage
  // =============================================

  async getAppUsage(query) {
    const { startDate, endDate, userId, limit = 25 } = query;

    const matchStage = {
      intervalStart: { $gte: new Date(startDate), $lte: new Date(endDate) },
      'activeWindows.0': { $exists: true },
    };
    if (userId) matchStage.user = new mongoose.Types.ObjectId(userId);

    const [appRanking, perUserApps] = await Promise.all([
      // Top apps by total duration
      ActivityLog.aggregate([
        { $match: matchStage },
        { $unwind: '$activeWindows' },
        {
          $group: {
            _id: '$activeWindows.appName',
            totalDuration: { $sum: '$activeWindows.duration' },
            sessionCount: { $sum: 1 },
            uniqueUsers: { $addToSet: '$user' },
          },
        },
        {
          $project: {
            appName: '$_id',
            totalDuration: 1,
            sessionCount: 1,
            uniqueUsers: { $size: '$uniqueUsers' },
          },
        },
        { $sort: { totalDuration: -1 } },
        { $limit: limit },
      ]),

      // Per-user top app
      ActivityLog.aggregate([
        { $match: matchStage },
        { $unwind: '$activeWindows' },
        {
          $group: {
            _id: { user: '$user', app: '$activeWindows.appName' },
            totalDuration: { $sum: '$activeWindows.duration' },
          },
        },
        { $sort: { '_id.user': 1, totalDuration: -1 } },
        {
          $group: {
            _id: '$_id.user',
            topApp: { $first: '$_id.app' },
            topAppDuration: { $first: '$totalDuration' },
            totalAppTime: { $sum: '$totalDuration' },
          },
        },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
        { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            userId: '$_id',
            name: { $concat: ['$userInfo.firstName', ' ', '$userInfo.lastName'] },
            topApp: 1,
            topAppDuration: 1,
            totalAppTime: 1,
          },
        },
        { $sort: { totalAppTime: -1 } },
      ]),
    ]);

    const grandTotal = appRanking.reduce((s, a) => s + a.totalDuration, 0);

    return {
      apps: appRanking.map((a) => ({
        ...a,
        percentage: grandTotal > 0 ? +((a.totalDuration / grandTotal) * 100).toFixed(1) : 0,
      })),
      perUser: perUserApps,
      summary: {
        totalAppsTracked: appRanking.length,
        totalDuration: grandTotal,
        dateRange: { startDate, endDate },
      },
    };
  }

  // =============================================
  // Private helpers
  // =============================================

  async _createAuditEntry(userId, action, { type, id, before, after, reason }) {
    await AuditLog.create({
      user: userId,
      action,
      target: { type, id },
      changes: { before, after },
      details: reason ? { reason } : {},
    });
  }
}

const adminService = new AdminService();
export default adminService;
