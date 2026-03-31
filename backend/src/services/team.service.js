import mongoose from 'mongoose';
import User from '../models/User.js';
import Project from '../models/Project.js';
import TimeEntry from '../models/TimeEntry.js';
import Submission from '../models/Submission.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import { ROLES } from '../constants/roles.js';

class TeamService {
  /**
   * Get the set of member userIds visible to the requester.
   * Manager: members of projects they manage.
   * Superadmin: null (no filter — sees all).
   */
  async _getScopedMemberIds(requesterId, requesterRole) {
    if (requesterRole === ROLES.SUPERADMIN) {
      return null;
    }

    const projects = await Project.find({
      managers: requesterId,
      status: { $ne: 'archived' },
    })
      .select('members')
      .lean();

    const ids = new Set();
    for (const p of projects) {
      for (const m of p.members) {
        ids.add(m.toString());
      }
    }

    return Array.from(ids).map((id) => new mongoose.Types.ObjectId(id));
  }

  /**
   * Check that the requester has access to the target member.
   */
  async _checkMemberAccess(targetId, requesterId, requesterRole) {
    if (requesterRole === ROLES.SUPERADMIN) return;

    const scopedIds = await this._getScopedMemberIds(requesterId, requesterRole);
    const isInScope =
      scopedIds && scopedIds.some((id) => id.toString() === targetId.toString());

    if (!isInScope) {
      throw ApiError.forbidden('You do not have access to this team member');
    }
  }

  /**
   * Get Monday 00:00 of the current week.
   */
  _getWeekStart() {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  /**
   * List team members with online status and weekly hours.
   */
  async listMembers(requesterId, requesterRole, query) {
    const { page, limit, role, status, search, projectId } = query;

    const scopedIds = await this._getScopedMemberIds(requesterId, requesterRole);

    const filter = {};
    if (scopedIds) filter._id = { $in: scopedIds };
    if (role) filter.role = role;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (projectId) {
      const project = await Project.findById(projectId).select('members').lean();
      if (project) {
        const projectMemberIds = project.members.map((m) => m.toString());
        if (filter._id) {
          const existingIds = filter._id.$in.map((id) => id.toString());
          filter._id.$in = projectMemberIds
            .filter((id) => existingIds.includes(id))
            .map((id) => new mongoose.Types.ObjectId(id));
        } else {
          filter._id = { $in: project.members };
        }
      }
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select(
          'firstName lastName email role isActive avatar timezone lastLoginAt invitationStatus createdAt'
        )
        .sort({ firstName: 1, lastName: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    if (users.length === 0) {
      return {
        members: [],
        pagination: { page, limit, total: 0, pages: 0 },
      };
    }

    const userIds = users.map((u) => u._id);
    const weekStart = this._getWeekStart();

    const [activeTimers, weeklyHours] = await Promise.all([
      TimeEntry.find({
        user: { $in: userIds },
        status: { $in: ['running', 'paused'] },
      })
        .populate('project', 'name color')
        .populate('task', 'title')
        .lean(),
      TimeEntry.aggregate([
        {
          $match: {
            user: { $in: userIds },
            status: 'completed',
            startTime: { $gte: weekStart },
          },
        },
        {
          $group: {
            _id: '$user',
            totalDuration: {
              $sum: { $subtract: ['$duration', '$totalBreakDuration'] },
            },
          },
        },
      ]),
    ]);

    const timerMap = new Map(
      activeTimers.map((t) => [t.user.toString(), t])
    );
    const hoursMap = new Map(
      weeklyHours.map((h) => [h._id.toString(), h.totalDuration])
    );

    const members = users.map((u) => {
      const uid = u._id.toString();
      const activeTimer = timerMap.get(uid) || null;
      return {
        ...u,
        isOnline: !!activeTimer,
        activeTimer: activeTimer
          ? {
              status: activeTimer.status,
              project: activeTimer.project,
              task: activeTimer.task,
              description: activeTimer.description,
              startTime: activeTimer.startTime,
            }
          : null,
        hoursThisWeek: hoursMap.get(uid) || 0,
      };
    });

    return {
      members,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get full member profile with stats.
   */
  async getMember(targetId, requesterId, requesterRole) {
    await this._checkMemberAccess(targetId, requesterId, requesterRole);

    const user = await User.findById(targetId)
      .select(
        'firstName lastName email role isActive avatar timezone lastLoginAt invitedBy invitationStatus createdAt'
      )
      .lean();

    if (!user) throw ApiError.notFound('Member not found');

    const weekStart = this._getWeekStart();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const targetObjId = new mongoose.Types.ObjectId(targetId);

    const [weeklyStats, monthlyStats, recentEntries, assignedProjects, activeTimer] =
      await Promise.all([
        TimeEntry.aggregate([
          {
            $match: {
              user: targetObjId,
              status: 'completed',
              startTime: { $gte: weekStart },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $subtract: ['$duration', '$totalBreakDuration'] } },
              count: { $sum: 1 },
            },
          },
        ]),
        TimeEntry.aggregate([
          {
            $match: {
              user: targetObjId,
              status: 'completed',
              startTime: { $gte: monthStart },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $subtract: ['$duration', '$totalBreakDuration'] } },
              count: { $sum: 1 },
            },
          },
        ]),
        TimeEntry.find({ user: targetId, status: 'completed' })
          .populate('project', 'name color')
          .populate('task', 'title')
          .sort({ startTime: -1 })
          .limit(10)
          .lean(),
        Project.find({ members: targetId, status: { $ne: 'archived' } })
          .select('name color status')
          .lean(),
        TimeEntry.findOne({
          user: targetId,
          status: { $in: ['running', 'paused'] },
        })
          .populate('project', 'name color')
          .populate('task', 'title')
          .lean(),
      ]);

    return {
      member: {
        ...user,
        stats: {
          hoursThisWeek: weeklyStats[0]?.total || 0,
          hoursThisMonth: monthlyStats[0]?.total || 0,
          entriesThisWeek: weeklyStats[0]?.count || 0,
          projectsCount: assignedProjects.length,
        },
        isOnline: !!activeTimer,
        activeTimer: activeTimer
          ? {
              status: activeTimer.status,
              project: activeTimer.project,
              task: activeTimer.task,
              description: activeTimer.description,
              startTime: activeTimer.startTime,
            }
          : null,
        recentEntries,
        assignedProjects,
      },
    };
  }

  /**
   * Change a member's role. Superadmin only.
   */
  async updateRole(targetId, newRole, requesterId) {
    if (targetId.toString() === requesterId.toString()) {
      throw ApiError.badRequest('Cannot change your own role');
    }

    const user = await User.findById(targetId);
    if (!user) throw ApiError.notFound('Member not found');

    if (user.role === ROLES.SUPERADMIN && newRole !== ROLES.SUPERADMIN) {
      const count = await User.countDocuments({ role: ROLES.SUPERADMIN });
      if (count <= 1) {
        throw ApiError.badRequest('Cannot demote the only superadmin');
      }
    }

    user.role = newRole;
    await user.save();

    logger.info(`Role updated for user ${targetId} to ${newRole} by ${requesterId}`);
    return user;
  }

  /**
   * Activate or deactivate a member.
   */
  async updateStatus(targetId, isActive, requesterId, requesterRole) {
    if (targetId.toString() === requesterId.toString()) {
      throw ApiError.badRequest('Cannot change your own active status');
    }

    await this._checkMemberAccess(targetId, requesterId, requesterRole);

    const user = await User.findById(targetId);
    if (!user) throw ApiError.notFound('Member not found');

    user.isActive = isActive;
    await user.save();

    logger.info(
      `User ${targetId} ${isActive ? 'activated' : 'deactivated'} by ${requesterId}`
    );
    return user;
  }

  /**
   * Invite a new member. Creates user with pending status.
   */
  async inviteMember(inviterId, data) {
    const { email, firstName, lastName, role, projectIds } = data;

    const existing = await User.findOne({ email });
    if (existing) {
      throw ApiError.badRequest('A user with this email already exists');
    }

    const tempPassword = `Invite_${Math.random().toString(36).slice(2, 10)}!1A`;

    const user = await User.create({
      email,
      firstName,
      lastName,
      role,
      password: tempPassword,
      isActive: true,
      isEmailVerified: false,
      invitedBy: inviterId,
      invitationStatus: 'pending',
    });

    if (projectIds.length > 0) {
      await Project.updateMany(
        { _id: { $in: projectIds } },
        { $addToSet: { members: user._id } }
      );
    }

    // TODO: emailService.sendInvitation(user.email, tempPassword);

    logger.info(`User ${email} invited by ${inviterId} with role ${role}`);
    return user;
  }

  /**
   * Get team KPI stats.
   */
  async getStats(requesterId, requesterRole) {
    const scopedIds = await this._getScopedMemberIds(requesterId, requesterRole);
    const memberFilter = scopedIds
      ? { _id: { $in: scopedIds }, isActive: true }
      : { isActive: true };
    const entryUserFilter = scopedIds ? { user: { $in: scopedIds } } : {};

    const weekStart = this._getWeekStart();

    const [totalMembers, activeTimerUserIds, weeklyHoursAgg] = await Promise.all([
      User.countDocuments(memberFilter),
      TimeEntry.distinct('user', {
        ...entryUserFilter,
        status: { $in: ['running', 'paused'] },
      }),
      TimeEntry.aggregate([
        {
          $match: {
            ...entryUserFilter,
            status: 'completed',
            startTime: { $gte: weekStart },
          },
        },
        {
          $group: {
            _id: '$user',
            userTotal: {
              $sum: { $subtract: ['$duration', '$totalBreakDuration'] },
            },
          },
        },
      ]),
    ]);

    const totalWeeklySeconds = weeklyHoursAgg.reduce(
      (sum, u) => sum + u.userTotal,
      0
    );
    const avgSecondsPerMember =
      totalMembers > 0 ? Math.round(totalWeeklySeconds / totalMembers) : 0;

    return {
      totalMembers,
      activeNow: activeTimerUserIds.length,
      totalHoursThisWeek: totalWeeklySeconds,
      avgHoursPerMember: avgSecondsPerMember,
    };
  }
  // =============================================
  // Phase 6B: Team Activity & Timesheets
  // =============================================

  /**
   * Get recent time entries across the team as an activity feed.
   */
  async getActivityFeed(requesterId, requesterRole, query) {
    const { page = 1, limit = 20, memberId, projectId, startDate, endDate } = query;

    const scopedIds = await this._getScopedMemberIds(requesterId, requesterRole);

    const filter = { status: 'completed' };

    if (memberId) {
      if (scopedIds) {
        const isInScope = scopedIds.some((id) => id.toString() === memberId);
        if (!isInScope) throw ApiError.forbidden('Member not in your scope');
      }
      filter.user = new mongoose.Types.ObjectId(memberId);
    } else if (scopedIds) {
      filter.user = { $in: scopedIds };
    }

    if (projectId) filter.project = new mongoose.Types.ObjectId(projectId);
    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate) filter.startTime.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      TimeEntry.find(filter)
        .populate('user', 'firstName lastName avatar')
        .populate('project', 'name color')
        .populate('task', 'title')
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TimeEntry.countDocuments(filter),
    ]);

    return {
      entries,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get currently active/paused timers across the team.
   */
  async getLiveStatus(requesterId, requesterRole) {
    const scopedIds = await this._getScopedMemberIds(requesterId, requesterRole);

    const filter = { status: { $in: ['running', 'paused'] } };
    if (scopedIds) filter.user = { $in: scopedIds };

    const activeEntries = await TimeEntry.find(filter)
      .populate('user', 'firstName lastName avatar email')
      .populate('project', 'name color')
      .populate('task', 'title')
      .sort({ startTime: -1 })
      .lean();

    return { activeMembers: activeEntries };
  }

  /**
   * List team submissions (all statuses) for manager review.
   */
  async getTeamTimesheets(requesterId, requesterRole, query) {
    const { page = 1, limit = 10, memberId, status, startDate, endDate } = query;

    const scopedIds = await this._getScopedMemberIds(requesterId, requesterRole);

    const filter = {};

    if (memberId) {
      filter.user = new mongoose.Types.ObjectId(memberId);
    } else if (scopedIds) {
      filter.user = { $in: scopedIds };
    }

    if (status) filter.status = status;

    if (startDate || endDate) {
      filter['period.startDate'] = {};
      if (startDate) filter['period.startDate'].$gte = new Date(startDate);
      if (endDate) filter['period.startDate'].$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      Submission.find(filter)
        .populate('user', 'firstName lastName email avatar')
        .populate('projectBreakdown.project', 'name color')
        .populate('reviewedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Submission.countDocuments(filter),
    ]);

    return {
      submissions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Quick approve a submission from team view.
   */
  async approveTeamTimesheet(submissionId, managerId, requesterRole) {
    const submission = await Submission.findById(submissionId);
    if (!submission) throw ApiError.notFound('Submission not found');

    if (submission.status !== 'submitted') {
      throw ApiError.badRequest('Only submitted timesheets can be approved');
    }

    if (requesterRole !== ROLES.SUPERADMIN) {
      const hasAccess = await this._isManagerOfSubmission(managerId, submission);
      if (!hasAccess) throw ApiError.forbidden('You cannot approve this submission');
    }

    submission.status = 'approved';
    submission.reviewedAt = new Date();
    submission.reviewedBy = managerId;
    submission.version += 1;
    submission.approvalChain.push({
      user: managerId,
      action: 'approved',
      comment: '',
      timestamp: new Date(),
    });

    await submission.save();
    logger.info(`Submission ${submissionId} approved by ${managerId} via team view`);
    return submission;
  }

  /**
   * Quick reject a submission from team view.
   */
  async rejectTeamTimesheet(submissionId, managerId, requesterRole, comment) {
    const submission = await Submission.findById(submissionId);
    if (!submission) throw ApiError.notFound('Submission not found');

    if (submission.status !== 'submitted') {
      throw ApiError.badRequest('Only submitted timesheets can be rejected');
    }

    if (requesterRole !== ROLES.SUPERADMIN) {
      const hasAccess = await this._isManagerOfSubmission(managerId, submission);
      if (!hasAccess) throw ApiError.forbidden('You cannot reject this submission');
    }

    submission.status = 'rejected';
    submission.reviewedAt = new Date();
    submission.reviewedBy = managerId;
    submission.version += 1;
    submission.approvalChain.push({
      user: managerId,
      action: 'rejected',
      comment: comment || '',
      timestamp: new Date(),
    });

    await submission.save();
    logger.info(`Submission ${submissionId} rejected by ${managerId} via team view`);
    return submission;
  }

  // =============================================
  // Phase 6C: Team Analytics
  // =============================================

  /**
   * Hours breakdown by member for a date range.
   */
  async getHoursBreakdown(requesterId, requesterRole, query) {
    const { startDate, endDate } = query;
    const scopedIds = await this._getScopedMemberIds(requesterId, requesterRole);

    const matchStage = {
      status: 'completed',
      startTime: { $gte: new Date(startDate), $lte: new Date(endDate) },
    };
    if (scopedIds) matchStage.user = { $in: scopedIds };

    const breakdown = await TimeEntry.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$user',
          totalSeconds: { $sum: { $subtract: ['$duration', '$totalBreakDuration'] } },
          entryCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          firstName: '$userInfo.firstName',
          lastName: '$userInfo.lastName',
          avatar: '$userInfo.avatar',
          totalSeconds: 1,
          entryCount: 1,
        },
      },
      { $sort: { totalSeconds: -1 } },
    ]);

    return { breakdown };
  }

  /**
   * Hours per project across the team for a date range.
   */
  async getProjectDistribution(requesterId, requesterRole, query) {
    const { startDate, endDate } = query;
    const scopedIds = await this._getScopedMemberIds(requesterId, requesterRole);

    const matchStage = {
      status: 'completed',
      startTime: { $gte: new Date(startDate), $lte: new Date(endDate) },
    };
    if (scopedIds) matchStage.user = { $in: scopedIds };

    const distribution = await TimeEntry.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$project',
          totalSeconds: { $sum: { $subtract: ['$duration', '$totalBreakDuration'] } },
          memberIds: { $addToSet: '$user' },
          entryCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: '_id',
          as: 'projectInfo',
        },
      },
      {
        $project: {
          _id: 0,
          projectId: '$_id',
          name: { $ifNull: [{ $arrayElemAt: ['$projectInfo.name', 0] }, 'No Project'] },
          color: { $ifNull: [{ $arrayElemAt: ['$projectInfo.color', 0] }, '#64748b'] },
          totalSeconds: 1,
          memberCount: { $size: '$memberIds' },
          entryCount: 1,
        },
      },
      { $sort: { totalSeconds: -1 } },
    ]);

    return { distribution };
  }

  /**
   * Weekly trends for the last N weeks.
   */
  async getWeeklyTrends(requesterId, requesterRole, query) {
    const { weeksBack = 8 } = query;
    const scopedIds = await this._getScopedMemberIds(requesterId, requesterRole);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeksBack * 7);
    startDate.setHours(0, 0, 0, 0);

    const matchStage = {
      status: 'completed',
      startTime: { $gte: startDate },
    };
    if (scopedIds) matchStage.user = { $in: scopedIds };

    const trends = await TimeEntry.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            week: { $isoWeek: '$startTime' },
            year: { $isoWeekYear: '$startTime' },
          },
          totalSeconds: { $sum: { $subtract: ['$duration', '$totalBreakDuration'] } },
          memberIds: { $addToSet: '$user' },
          entryCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          week: '$_id.week',
          year: '$_id.year',
          totalSeconds: 1,
          activeMemberCount: { $size: '$memberIds' },
          entryCount: 1,
        },
      },
      { $sort: { year: 1, week: 1 } },
    ]);

    // Calculate avg per member for each week
    const result = trends.map((t) => ({
      ...t,
      avgSecondsPerMember:
        t.activeMemberCount > 0 ? Math.round(t.totalSeconds / t.activeMemberCount) : 0,
    }));

    return { trends: result };
  }

  /**
   * Check if a user is a manager of any project in a submission.
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

const teamService = new TeamService();
export default teamService;
