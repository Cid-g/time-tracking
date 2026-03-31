import mongoose from 'mongoose';
import Project from '../models/Project.js';
import User from '../models/User.js';
import TimeEntry from '../models/TimeEntry.js';
import ApiError from '../utils/ApiError.js';
import { ROLES } from '../constants/roles.js';

class ProjectService {
  /**
   * Create a new project. Auto-adds creator as manager and member.
   */
  async createProject(userId, data) {
    // Check for duplicate name
    const existing = await Project.findOne({ name: data.name });
    if (existing) {
      throw ApiError.badRequest('A project with this name already exists');
    }

    // Validate client exists and has client role
    if (data.client) {
      const clientUser = await User.findById(data.client);
      if (!clientUser || clientUser.role !== ROLES.CLIENT) {
        throw ApiError.badRequest('Invalid client user');
      }
    }

    // Ensure creator is included in managers and members
    const managers = [...new Set([userId.toString(), ...(data.managers || []).map(String)])];
    const members = [...new Set([userId.toString(), ...(data.members || []).map(String)])];

    const project = await Project.create({
      ...data,
      managers,
      members,
      createdBy: userId,
    });

    return project;
  }

  /**
   * Get a single project with access check.
   */
  async getProject(projectId, userId, userRole) {
    const project = await Project.findById(projectId)
      .populate('members', 'firstName lastName email avatar')
      .populate('managers', 'firstName lastName email avatar')
      .populate('client', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName');

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    this._checkProjectAccess(project, userId, userRole);

    return project;
  }

  /**
   * List projects with role-based filtering.
   */
  async listProjects(userId, userRole, query) {
    const { page = 1, limit = 20, status, search } = query;

    const filter = {};

    // Role-based filtering
    if (userRole === ROLES.SUPERADMIN) {
      // Superadmin sees all
    } else if (userRole === ROLES.CLIENT) {
      filter.client = userId;
    } else {
      // Members and managers see projects they belong to
      filter.$or = [{ members: userId }, { managers: userId }];
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('members', 'firstName lastName avatar')
        .populate('managers', 'firstName lastName avatar')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments(filter),
    ]);

    return {
      projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update a project (project managers and superadmins only).
   */
  async updateProject(projectId, userId, userRole, data) {
    const project = await Project.findById(projectId);

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    this._checkManageAccess(project, userId, userRole);

    // Check duplicate name if name is being changed
    if (data.name && data.name !== project.name) {
      const existing = await Project.findOne({ name: data.name, _id: { $ne: projectId } });
      if (existing) {
        throw ApiError.badRequest('A project with this name already exists');
      }
    }

    // Validate client if changing
    if (data.client) {
      const clientUser = await User.findById(data.client);
      if (!clientUser || clientUser.role !== ROLES.CLIENT) {
        throw ApiError.badRequest('Invalid client user');
      }
    }

    Object.assign(project, data);
    await project.save();

    return project;
  }

  /**
   * Archive a project (superadmin only — enforced at route level).
   */
  async deleteProject(projectId) {
    const project = await Project.findById(projectId);

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    project.status = 'archived';
    await project.save();

    return project;
  }

  /**
   * Add members to a project.
   */
  async addMembers(projectId, userId, userRole, memberIds) {
    const project = await Project.findById(projectId);

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    this._checkManageAccess(project, userId, userRole);

    // Validate all users exist
    const users = await User.find({ _id: { $in: memberIds }, isActive: true });
    if (users.length !== memberIds.length) {
      throw ApiError.badRequest('One or more users not found or inactive');
    }

    // Add unique members
    const currentMembers = project.members.map(String);
    const newMembers = memberIds.filter((id) => !currentMembers.includes(id));

    if (newMembers.length === 0) {
      throw ApiError.badRequest('All specified users are already project members');
    }

    project.members.push(...newMembers);
    await project.save();

    await project.populate('members', 'firstName lastName email avatar');

    return project;
  }

  /**
   * Remove a member from a project.
   */
  async removeMember(projectId, userId, userRole, targetUserId) {
    const project = await Project.findById(projectId);

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    this._checkManageAccess(project, userId, userRole);

    const memberIndex = project.members.findIndex(
      (m) => m.toString() === targetUserId
    );

    if (memberIndex === -1) {
      throw ApiError.badRequest('User is not a member of this project');
    }

    // Prevent removing the last manager
    const isManager = project.managers.some((m) => m.toString() === targetUserId);
    if (isManager && project.managers.length === 1) {
      throw ApiError.badRequest('Cannot remove the last manager from a project');
    }

    project.members.splice(memberIndex, 1);

    // Also remove from managers if applicable
    if (isManager) {
      project.managers = project.managers.filter(
        (m) => m.toString() !== targetUserId
      );
    }

    await project.save();

    return project;
  }

  /**
   * Get time tracking summary for a project.
   */
  async getProjectSummary(projectId, userId, userRole, startDate, endDate) {
    const project = await Project.findById(projectId);

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    this._checkProjectAccess(project, userId, userRole);

    const matchStage = {
      project: new mongoose.Types.ObjectId(projectId),
      status: 'completed',
    };

    if (startDate || endDate) {
      matchStage.startTime = {};
      if (startDate) matchStage.startTime.$gte = new Date(startDate);
      if (endDate) matchStage.startTime.$lte = new Date(endDate);
    }

    const [summary, memberBreakdown] = await Promise.all([
      TimeEntry.aggregate([
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
      ]),
      TimeEntry.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$user',
            totalDuration: { $sum: '$duration' },
            totalBreaks: { $sum: '$totalBreakDuration' },
            entryCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            firstName: '$user.firstName',
            lastName: '$user.lastName',
            avatar: '$user.avatar',
            totalDuration: 1,
            netDuration: { $subtract: ['$totalDuration', '$totalBreaks'] },
            entryCount: 1,
          },
        },
        { $sort: { totalDuration: -1 } },
      ]),
    ]);

    const totals = summary[0] || {
      totalDuration: 0,
      totalBreaks: 0,
      entryCount: 0,
      billableSeconds: 0,
    };

    return {
      totalDuration: totals.totalDuration,
      totalBreaks: totals.totalBreaks,
      netDuration: totals.totalDuration - totals.totalBreaks,
      entryCount: totals.entryCount,
      billableSeconds: totals.billableSeconds,
      memberBreakdown,
    };
  }

  /**
   * Check if user has view access to a project.
   */
  _checkProjectAccess(project, userId, userRole) {
    if (userRole === ROLES.SUPERADMIN) return;

    const uid = userId.toString();

    if (userRole === ROLES.CLIENT) {
      if (project.client?.toString() !== uid) {
        throw ApiError.forbidden('You do not have access to this project');
      }
      return;
    }

    const isMember = project.members.some((m) => m.toString() === uid || m._id?.toString() === uid);
    const isManager = project.managers.some((m) => m.toString() === uid || m._id?.toString() === uid);

    if (!isMember && !isManager) {
      throw ApiError.forbidden('You do not have access to this project');
    }
  }

  /**
   * Check if user has manage access (project manager or superadmin).
   */
  _checkManageAccess(project, userId, userRole) {
    if (userRole === ROLES.SUPERADMIN) return;

    const uid = userId.toString();
    const isManager = project.managers.some((m) => m.toString() === uid);

    if (!isManager) {
      throw ApiError.forbidden('Only project managers can perform this action');
    }
  }
}

const projectService = new ProjectService();
export default projectService;
