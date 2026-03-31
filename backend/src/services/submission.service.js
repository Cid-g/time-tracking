import mongoose from 'mongoose';
import Submission from '../models/Submission.js';
import TimeEntry from '../models/TimeEntry.js';
import Project from '../models/Project.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

class SubmissionService {
  /**
   * Create a draft submission from selected time entries.
   * Validates ownership, completion status, and no duplicate submissions.
   */
  async createSubmission(userId, data) {
    const { entries: entryIds, period, notes } = data;

    // Verify all entries belong to user and are completed
    const entries = await TimeEntry.find({
      _id: { $in: entryIds },
      user: userId,
    });

    if (entries.length !== entryIds.length) {
      throw ApiError.badRequest('Some time entries were not found or do not belong to you');
    }

    const incomplete = entries.find((e) => e.status !== 'completed');
    if (incomplete) {
      throw ApiError.badRequest('All time entries must be completed before submission');
    }

    // Check none of the entries are already in an active submission
    const existing = await Submission.findOne({
      user: userId,
      entries: { $in: entryIds },
      status: { $in: ['draft', 'submitted', 'under_review', 'approved'] },
    });

    if (existing) {
      throw ApiError.badRequest(
        'One or more entries are already part of an active submission'
      );
    }

    // Calculate totals
    let totalDuration = 0;
    let totalBillable = 0;
    const projectMap = new Map();

    for (const entry of entries) {
      const net = entry.duration - entry.totalBreakDuration;
      totalDuration += net;

      if (entry.isBillable) {
        totalBillable += net;
      }

      const projKey = entry.project ? entry.project.toString() : 'none';
      if (!projectMap.has(projKey)) {
        projectMap.set(projKey, { project: entry.project || null, duration: 0, entryCount: 0 });
      }
      const proj = projectMap.get(projKey);
      proj.duration += net;
      proj.entryCount += 1;
    }

    const submission = await Submission.create({
      user: userId,
      entries: entryIds,
      period: {
        startDate: new Date(period.startDate),
        endDate: new Date(period.endDate),
      },
      status: 'draft',
      totalDuration,
      totalBillable,
      entryCount: entries.length,
      projectBreakdown: Array.from(projectMap.values()),
      notes: notes || '',
    });

    return submission;
  }

  /**
   * Submit a draft for manager approval.
   */
  async submitSubmission(submissionId, userId) {
    const submission = await Submission.findOne({ _id: submissionId, user: userId });

    if (!submission) {
      throw ApiError.notFound('Submission not found');
    }

    if (submission.status !== 'draft') {
      throw ApiError.badRequest('Only draft submissions can be submitted');
    }

    submission.status = 'submitted';
    submission.submittedAt = new Date();
    submission.version += 1;
    submission.approvalChain.push({
      user: userId,
      action: 'submitted',
      comment: '',
      timestamp: new Date(),
    });

    await submission.save();
    logger.info(`Submission ${submissionId} submitted by user ${userId}`);

    return submission;
  }

  /**
   * Get a single submission with populated data.
   */
  async getSubmission(submissionId, userId, userRole) {
    const submission = await Submission.findById(submissionId)
      .populate('user', 'firstName lastName email role')
      .populate({
        path: 'entries',
        populate: [
          { path: 'project', select: 'name color' },
          { path: 'task', select: 'title status' },
        ],
      })
      .populate('projectBreakdown.project', 'name color')
      .populate('approvalChain.user', 'firstName lastName')
      .populate('reviewedBy', 'firstName lastName');

    if (!submission) {
      throw ApiError.notFound('Submission not found');
    }

    // Access control: owner, project manager, or superadmin
    const isOwner = submission.user._id.toString() === userId.toString();
    const isSuperAdmin = userRole === 'superadmin';

    if (!isOwner && !isSuperAdmin) {
      // Check if user is a manager of any project in this submission
      const hasAccess = await this._isManagerOfSubmission(userId, submission);
      if (!hasAccess) {
        throw ApiError.forbidden('You do not have access to this submission');
      }
    }

    return submission;
  }

  /**
   * List current user's submissions with pagination and filtering.
   */
  async listMySubmissions(userId, query) {
    const { page = 1, limit = 10, status, startDate, endDate } = query;

    const filter = { user: userId };

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter['period.startDate'] = {};
      if (startDate) filter['period.startDate'].$gte = new Date(startDate);
      if (endDate) filter['period.startDate'].$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      Submission.find(filter)
        .populate('user', 'firstName lastName')
        .populate('projectBreakdown.project', 'name color')
        .sort({ createdAt: -1 })
        .skip(skip)
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

  /**
   * List pending submissions for manager approval.
   * Returns submissions from members in the manager's projects.
   */
  async listPendingApprovals(managerId, userRole, query) {
    const { page = 1, limit = 10 } = query;

    let filter = { status: 'submitted' };

    if (userRole !== 'superadmin') {
      // Find projects where this user is a manager
      const managedProjects = await Project.find({
        managers: managerId,
        status: 'active',
      }).select('members');

      // Collect all member userIds from managed projects
      const memberIds = new Set();
      for (const proj of managedProjects) {
        for (const memberId of proj.members) {
          memberIds.add(memberId.toString());
        }
      }

      if (memberIds.size === 0) {
        return { submissions: [], pagination: { page, limit, total: 0, pages: 0 } };
      }

      filter.user = {
        $in: Array.from(memberIds).map((id) => new mongoose.Types.ObjectId(id)),
      };
    }

    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      Submission.find(filter)
        .populate('user', 'firstName lastName email')
        .populate('projectBreakdown.project', 'name color')
        .sort({ submittedAt: -1 })
        .skip(skip)
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

  /**
   * Approve a submitted submission.
   */
  async approveSubmission(submissionId, managerId, comment) {
    const submission = await Submission.findById(submissionId);

    if (!submission) {
      throw ApiError.notFound('Submission not found');
    }

    if (submission.status !== 'submitted') {
      throw ApiError.badRequest('Only submitted timesheets can be approved');
    }

    submission.status = 'approved';
    submission.reviewedAt = new Date();
    submission.reviewedBy = managerId;
    submission.version += 1;
    submission.approvalChain.push({
      user: managerId,
      action: 'approved',
      comment: comment || '',
      timestamp: new Date(),
    });

    await submission.save();
    logger.info(`Submission ${submissionId} approved by ${managerId}`);

    return submission;
  }

  /**
   * Reject a submitted submission (reason required).
   */
  async rejectSubmission(submissionId, managerId, reason) {
    const submission = await Submission.findById(submissionId);

    if (!submission) {
      throw ApiError.notFound('Submission not found');
    }

    if (submission.status !== 'submitted') {
      throw ApiError.badRequest('Only submitted timesheets can be rejected');
    }

    submission.status = 'rejected';
    submission.reviewedAt = new Date();
    submission.reviewedBy = managerId;
    submission.version += 1;
    submission.approvalChain.push({
      user: managerId,
      action: 'rejected',
      comment: reason,
      timestamp: new Date(),
    });

    await submission.save();
    logger.info(`Submission ${submissionId} rejected by ${managerId}: ${reason}`);

    return submission;
  }

  /**
   * Bulk submit multiple draft submissions.
   */
  async bulkSubmit(userId, submissionIds) {
    const submissions = await Submission.find({
      _id: { $in: submissionIds },
      user: userId,
      status: 'draft',
    });

    if (submissions.length !== submissionIds.length) {
      throw ApiError.badRequest(
        'Some submissions were not found, do not belong to you, or are not in draft status'
      );
    }

    const now = new Date();
    const results = [];

    for (const submission of submissions) {
      submission.status = 'submitted';
      submission.submittedAt = now;
      submission.version += 1;
      submission.approvalChain.push({
        user: userId,
        action: 'submitted',
        comment: '',
        timestamp: now,
      });
      await submission.save();
      results.push(submission);
    }

    logger.info(`Bulk submitted ${results.length} submissions by user ${userId}`);

    return results;
  }

  /**
   * Delete a draft submission.
   */
  async deleteSubmission(submissionId, userId) {
    const submission = await Submission.findOne({ _id: submissionId, user: userId });

    if (!submission) {
      throw ApiError.notFound('Submission not found');
    }

    if (submission.status !== 'draft') {
      throw ApiError.badRequest('Only draft submissions can be deleted');
    }

    await Submission.deleteOne({ _id: submissionId });

    return submission;
  }

  /**
   * Check if a user is a manager of any project referenced in a submission.
   */
  async _isManagerOfSubmission(managerId, submission) {
    const projectIds = submission.projectBreakdown
      .filter((pb) => pb.project)
      .map((pb) => (pb.project._id || pb.project).toString());

    if (projectIds.length === 0) return false;

    const count = await Project.countDocuments({
      _id: { $in: projectIds },
      managers: managerId,
    });

    return count > 0;
  }
}

const submissionService = new SubmissionService();
export default submissionService;
