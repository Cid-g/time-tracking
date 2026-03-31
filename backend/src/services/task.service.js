import Task from '../models/Task.js';
import Project from '../models/Project.js';
import ApiError from '../utils/ApiError.js';
import { ROLES } from '../constants/roles.js';

class TaskService {
  /**
   * Create a task within a project.
   * Only project managers, superadmins, or project members can create tasks.
   */
  async createTask(projectId, userId, userRole, data) {
    const project = await Project.findById(projectId);

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    this._checkProjectAccess(project, userId, userRole);

    // Validate assignees are project members
    if (data.assignees && data.assignees.length > 0) {
      const projectMemberIds = project.members.map(String);
      const invalidAssignees = data.assignees.filter(
        (id) => !projectMemberIds.includes(id)
      );
      if (invalidAssignees.length > 0) {
        throw ApiError.badRequest('All assignees must be project members');
      }
    }

    const task = await Task.create({
      ...data,
      project: projectId,
      createdBy: userId,
    });

    return task;
  }

  /**
   * List tasks for a project with filtering.
   */
  async listTasks(projectId, userId, userRole, query) {
    const project = await Project.findById(projectId);

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    this._checkProjectAccess(project, userId, userRole);

    const { status, priority, assignee, page = 1, limit = 50 } = query;

    const filter = { project: projectId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignees = assignee;

    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignees', 'firstName lastName avatar')
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Task.countDocuments(filter),
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get tasks assigned to the current user across all projects.
   */
  async getMyTasks(userId, query) {
    const { status, projectId, page = 1, limit = 50 } = query;

    const filter = { assignees: userId };
    if (status) filter.status = status;
    if (projectId) filter.project = projectId;

    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('project', 'name color status')
        .populate('assignees', 'firstName lastName avatar')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Task.countDocuments(filter),
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update a task.
   * Project managers/superadmins can update all fields.
   * Assignees can update status only.
   */
  async updateTask(taskId, userId, userRole, data) {
    const task = await Task.findById(taskId);

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    const project = await Project.findById(task.project);
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    const uid = userId.toString();
    const isManager =
      userRole === ROLES.SUPERADMIN ||
      project.managers.some((m) => m.toString() === uid);
    const isAssignee = task.assignees.some((a) => a.toString() === uid);

    if (!isManager && !isAssignee) {
      throw ApiError.forbidden('You do not have access to update this task');
    }

    // Assignees can only update status
    if (!isManager && isAssignee) {
      if (data.status) {
        task.status = data.status;
      } else {
        throw ApiError.forbidden('Assignees can only update task status');
      }
    } else {
      // Managers/superadmin can update everything
      if (data.assignees && data.assignees.length > 0) {
        const projectMemberIds = project.members.map(String);
        const invalidAssignees = data.assignees.filter(
          (id) => !projectMemberIds.includes(id)
        );
        if (invalidAssignees.length > 0) {
          throw ApiError.badRequest('All assignees must be project members');
        }
      }

      Object.assign(task, data);
    }

    await task.save();

    return task;
  }

  /**
   * Delete a task (project managers and superadmins only).
   */
  async deleteTask(taskId, userId, userRole) {
    const task = await Task.findById(taskId);

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    const project = await Project.findById(task.project);
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    const uid = userId.toString();
    const isManager =
      userRole === ROLES.SUPERADMIN ||
      project.managers.some((m) => m.toString() === uid);

    if (!isManager) {
      throw ApiError.forbidden('Only project managers can delete tasks');
    }

    await Task.findByIdAndDelete(taskId);

    return task;
  }

  /**
   * Check if user has access to a project.
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

    const isMember = project.members.some((m) => m.toString() === uid);
    const isManager = project.managers.some((m) => m.toString() === uid);

    if (!isMember && !isManager) {
      throw ApiError.forbidden('You do not have access to this project');
    }
  }
}

const taskService = new TaskService();
export default taskService;
