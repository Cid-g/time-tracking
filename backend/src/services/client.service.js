import mongoose from 'mongoose';
import Project from '../models/Project.js';
import TimeEntry from '../models/TimeEntry.js';
import Task from '../models/Task.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import { ROLES } from '../constants/roles.js';

class ClientService {
  /**
   * Build a project filter scoped to the client.
   * Superadmin sees all projects; client sees only their own.
   */
  _getClientProjectFilter(clientId, clientRole) {
    if (clientRole === ROLES.SUPERADMIN) return {};
    return { client: new mongoose.Types.ObjectId(clientId) };
  }

  /**
   * Verify the client owns the given project.
   */
  _checkClientProjectAccess(project, clientId, clientRole) {
    if (clientRole === ROLES.SUPERADMIN) return;
    if (!project) throw ApiError.notFound('Project not found');
    if (!project.client || project.client.toString() !== clientId.toString()) {
      throw ApiError.forbidden('You do not have access to this project');
    }
  }

  /**
   * Client dashboard — aggregated stats across all client projects.
   */
  async getDashboard(clientId, clientRole) {
    const filter = this._getClientProjectFilter(clientId, clientRole);
    const projects = await Project.find(filter)
      .select('name status color billingType hourlyRate budgetHours budgetAmount')
      .lean();

    if (projects.length === 0) {
      return {
        stats: {
          totalProjects: 0,
          activeProjects: 0,
          completedProjects: 0,
          totalHoursTracked: 0,
          billableHours: 0,
          totalBudgetHours: 0,
          budgetUsedHours: 0,
          totalBudgetAmount: 0,
          totalMembers: 0,
        },
        recentActivity: [],
        projects: [],
      };
    }

    const projectIds = projects.map((p) => p._id);

    // Parallel aggregations
    const [hoursAgg, memberCountAgg, recentEntries, perProjectHours] = await Promise.all([
      // Total hours across all client projects
      TimeEntry.aggregate([
        { $match: { project: { $in: projectIds }, status: 'completed' } },
        {
          $group: {
            _id: null,
            totalSeconds: { $sum: { $subtract: ['$duration', '$totalBreakDuration'] } },
            billableSeconds: {
              $sum: {
                $cond: ['$isBillable', { $subtract: ['$duration', '$totalBreakDuration'] }, 0],
              },
            },
            entryCount: { $sum: 1 },
          },
        },
      ]),
      // Unique members across all client projects
      Project.aggregate([
        { $match: { _id: { $in: projectIds } } },
        { $unwind: '$members' },
        { $group: { _id: null, uniqueMembers: { $addToSet: '$members' } } },
        { $project: { count: { $size: '$uniqueMembers' } } },
      ]),
      // Recent 5 time entries
      TimeEntry.find({ project: { $in: projectIds }, status: 'completed' })
        .sort({ startTime: -1 })
        .limit(5)
        .populate('user', 'firstName lastName')
        .populate('project', 'name color')
        .populate('task', 'title')
        .lean(),
      // Hours per project (for dashboard mini-cards)
      TimeEntry.aggregate([
        { $match: { project: { $in: projectIds }, status: 'completed' } },
        {
          $group: {
            _id: '$project',
            totalSeconds: { $sum: { $subtract: ['$duration', '$totalBreakDuration'] } },
            billableSeconds: {
              $sum: {
                $cond: ['$isBillable', { $subtract: ['$duration', '$totalBreakDuration'] }, 0],
              },
            },
            entryCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const hours = hoursAgg[0] || { totalSeconds: 0, billableSeconds: 0, entryCount: 0 };
    const memberCount = memberCountAgg[0]?.count || 0;
    const hoursMap = new Map(perProjectHours.map((h) => [h._id.toString(), h]));

    // Budget calculations
    const totalBudgetHours = projects.reduce((sum, p) => sum + (p.budgetHours || 0), 0);
    const totalBudgetAmount = projects.reduce((sum, p) => sum + (p.budgetAmount || 0), 0);

    const projectSummaries = projects.map((p) => {
      const ph = hoursMap.get(p._id.toString()) || { totalSeconds: 0, billableSeconds: 0, entryCount: 0 };
      return {
        _id: p._id,
        name: p.name,
        status: p.status,
        color: p.color,
        billingType: p.billingType,
        budgetHours: p.budgetHours,
        budgetAmount: p.budgetAmount,
        hoursTracked: Math.round((ph.totalSeconds / 3600) * 100) / 100,
        billableHours: Math.round((ph.billableSeconds / 3600) * 100) / 100,
        entryCount: ph.entryCount,
      };
    });

    return {
      stats: {
        totalProjects: projects.length,
        activeProjects: projects.filter((p) => p.status === 'active').length,
        completedProjects: projects.filter((p) => p.status === 'completed').length,
        totalHoursTracked: Math.round((hours.totalSeconds / 3600) * 100) / 100,
        billableHours: Math.round((hours.billableSeconds / 3600) * 100) / 100,
        totalBudgetHours,
        budgetUsedHours: Math.round((hours.totalSeconds / 3600) * 100) / 100,
        totalBudgetAmount,
        totalMembers: memberCount,
      },
      recentActivity: recentEntries,
      projects: projectSummaries,
    };
  }

  /**
   * Paginated list of client projects with aggregated hours/tasks.
   */
  async listProjects(clientId, clientRole, query) {
    const { page, limit, status, search } = query;
    const filter = this._getClientProjectFilter(clientId, clientRole);

    if (status) filter.status = status;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .select('name description status color billingType hourlyRate budgetHours budgetAmount startDate endDate members managers')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments(filter),
    ]);

    if (projects.length === 0) {
      return { projects: [], pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    const projectIds = projects.map((p) => p._id);

    // Bulk aggregations
    const [hoursPerProject, tasksPerProject] = await Promise.all([
      TimeEntry.aggregate([
        { $match: { project: { $in: projectIds }, status: 'completed' } },
        {
          $group: {
            _id: '$project',
            totalSeconds: { $sum: { $subtract: ['$duration', '$totalBreakDuration'] } },
            billableSeconds: {
              $sum: {
                $cond: ['$isBillable', { $subtract: ['$duration', '$totalBreakDuration'] }, 0],
              },
            },
            entryCount: { $sum: 1 },
          },
        },
      ]),
      Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        {
          $group: {
            _id: '$project',
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
            inReview: { $sum: { $cond: [{ $eq: ['$status', 'in_review'] }, 1, 0] } },
            todo: { $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const hoursMap = new Map(hoursPerProject.map((h) => [h._id.toString(), h]));
    const tasksMap = new Map(tasksPerProject.map((t) => [t._id.toString(), t]));

    const enriched = projects.map((p) => {
      const h = hoursMap.get(p._id.toString()) || { totalSeconds: 0, billableSeconds: 0, entryCount: 0 };
      const t = tasksMap.get(p._id.toString()) || { total: 0, completed: 0, inProgress: 0, inReview: 0, todo: 0 };
      return {
        ...p,
        memberCount: (p.members || []).length,
        managerCount: (p.managers || []).length,
        members: undefined,
        managers: undefined,
        hoursTracked: Math.round((h.totalSeconds / 3600) * 100) / 100,
        billableHours: Math.round((h.billableSeconds / 3600) * 100) / 100,
        entryCount: h.entryCount,
        taskStats: { total: t.total, completed: t.completed, inProgress: t.inProgress, inReview: t.inReview, todo: t.todo },
      };
    });

    return {
      projects: enriched,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Detailed project view for client.
   */
  async getProjectDetail(projectId, clientId, clientRole) {
    const project = await Project.findById(projectId)
      .populate('members', 'firstName lastName')
      .populate('managers', 'firstName lastName')
      .lean();

    if (!project) throw ApiError.notFound('Project not found');
    this._checkClientProjectAccess(project, clientId, clientRole);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const pid = new mongoose.Types.ObjectId(projectId);

    const [taskProgress, memberBreakdown, dailyBreakdown, summary] = await Promise.all([
      Task.aggregate([
        { $match: { project: pid } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
            inReview: { $sum: { $cond: [{ $eq: ['$status', 'in_review'] }, 1, 0] } },
            todo: { $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] } },
          },
        },
      ]),
      TimeEntry.aggregate([
        { $match: { project: pid, status: 'completed' } },
        {
          $group: {
            _id: '$user',
            totalSeconds: { $sum: { $subtract: ['$duration', '$totalBreakDuration'] } },
            billableSeconds: {
              $sum: {
                $cond: ['$isBillable', { $subtract: ['$duration', '$totalBreakDuration'] }, 0],
              },
            },
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
        {
          $project: {
            _id: 0,
            userId: '$_id',
            firstName: { $arrayElemAt: ['$userInfo.firstName', 0] },
            lastName: { $arrayElemAt: ['$userInfo.lastName', 0] },
            totalSeconds: 1,
            billableSeconds: 1,
            entryCount: 1,
          },
        },
        { $sort: { totalSeconds: -1 } },
      ]),
      TimeEntry.aggregate([
        { $match: { project: pid, status: 'completed', startTime: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
            totalSeconds: { $sum: { $subtract: ['$duration', '$totalBreakDuration'] } },
            entryCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      TimeEntry.aggregate([
        { $match: { project: pid, status: 'completed' } },
        {
          $group: {
            _id: null,
            totalSeconds: { $sum: { $subtract: ['$duration', '$totalBreakDuration'] } },
            billableSeconds: {
              $sum: {
                $cond: ['$isBillable', { $subtract: ['$duration', '$totalBreakDuration'] }, 0],
              },
            },
            entryCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const tasks = taskProgress[0] || { total: 0, completed: 0, inProgress: 0, inReview: 0, todo: 0 };
    const totals = summary[0] || { totalSeconds: 0, billableSeconds: 0, entryCount: 0 };

    return {
      project,
      summary: {
        totalSeconds: totals.totalSeconds,
        billableSeconds: totals.billableSeconds,
        entryCount: totals.entryCount,
        hoursTracked: Math.round((totals.totalSeconds / 3600) * 100) / 100,
        billableHours: Math.round((totals.billableSeconds / 3600) * 100) / 100,
      },
      taskProgress: tasks,
      memberBreakdown,
      dailyBreakdown: dailyBreakdown.map((d) => ({
        date: d._id,
        totalSeconds: d.totalSeconds,
        entryCount: d.entryCount,
      })),
    };
  }

  /**
   * Filterable time report for a client project.
   */
  async getProjectReport(projectId, clientId, clientRole, query) {
    const project = await Project.findById(projectId).lean();
    if (!project) throw ApiError.notFound('Project not found');
    this._checkClientProjectAccess(project, clientId, clientRole);

    const { startDate, endDate, groupBy, page, limit } = query;
    const pid = new mongoose.Types.ObjectId(projectId);
    const matchStage = {
      project: pid,
      status: 'completed',
      startTime: { $gte: new Date(startDate), $lte: new Date(endDate + 'T23:59:59.999Z') },
    };

    const skip = (page - 1) * limit;

    // Build grouped aggregation based on groupBy
    let grouped;
    if (groupBy === 'member') {
      grouped = await TimeEntry.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$user',
            totalSeconds: { $sum: { $subtract: ['$duration', '$totalBreakDuration'] } },
            billableSeconds: {
              $sum: { $cond: ['$isBillable', { $subtract: ['$duration', '$totalBreakDuration'] }, 0] },
            },
            entryCount: { $sum: 1 },
          },
        },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            firstName: { $arrayElemAt: ['$userInfo.firstName', 0] },
            lastName: { $arrayElemAt: ['$userInfo.lastName', 0] },
            totalSeconds: 1,
            billableSeconds: 1,
            entryCount: 1,
          },
        },
        { $sort: { totalSeconds: -1 } },
      ]);
    } else if (groupBy === 'task') {
      grouped = await TimeEntry.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$task',
            totalSeconds: { $sum: { $subtract: ['$duration', '$totalBreakDuration'] } },
            billableSeconds: {
              $sum: { $cond: ['$isBillable', { $subtract: ['$duration', '$totalBreakDuration'] }, 0] },
            },
            entryCount: { $sum: 1 },
          },
        },
        { $lookup: { from: 'tasks', localField: '_id', foreignField: '_id', as: 'taskInfo' } },
        {
          $project: {
            _id: 0,
            taskId: '$_id',
            title: { $ifNull: [{ $arrayElemAt: ['$taskInfo.title', 0] }, 'No Task'] },
            status: { $ifNull: [{ $arrayElemAt: ['$taskInfo.status', 0] }, null] },
            totalSeconds: 1,
            billableSeconds: 1,
            entryCount: 1,
          },
        },
        { $sort: { totalSeconds: -1 } },
      ]);
    } else {
      // groupBy === 'day'
      grouped = await TimeEntry.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
            totalSeconds: { $sum: { $subtract: ['$duration', '$totalBreakDuration'] } },
            billableSeconds: {
              $sum: { $cond: ['$isBillable', { $subtract: ['$duration', '$totalBreakDuration'] }, 0] },
            },
            entryCount: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            date: '$_id',
            totalSeconds: 1,
            billableSeconds: 1,
            entryCount: 1,
          },
        },
        { $sort: { date: 1 } },
      ]);
    }

    // Paginated raw entries + summary
    const [entries, total, summaryAgg] = await Promise.all([
      TimeEntry.find(matchStage)
        .populate('user', 'firstName lastName')
        .populate('task', 'title status')
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TimeEntry.countDocuments(matchStage),
      TimeEntry.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalSeconds: { $sum: { $subtract: ['$duration', '$totalBreakDuration'] } },
            billableSeconds: {
              $sum: { $cond: ['$isBillable', { $subtract: ['$duration', '$totalBreakDuration'] }, 0] },
            },
            entryCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totals = summaryAgg[0] || { totalSeconds: 0, billableSeconds: 0, entryCount: 0 };

    return {
      grouped,
      entries,
      summary: {
        totalSeconds: totals.totalSeconds,
        billableSeconds: totals.billableSeconds,
        entryCount: totals.entryCount,
        hoursTracked: Math.round((totals.totalSeconds / 3600) * 100) / 100,
        billableHours: Math.round((totals.billableSeconds / 3600) * 100) / 100,
      },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Export project report as CSV.
   */
  async exportProjectReport(projectId, clientId, clientRole, query) {
    const project = await Project.findById(projectId).lean();
    if (!project) throw ApiError.notFound('Project not found');
    this._checkClientProjectAccess(project, clientId, clientRole);

    const { startDate, endDate } = query;
    const matchStage = {
      project: new mongoose.Types.ObjectId(projectId),
      status: 'completed',
      startTime: { $gte: new Date(startDate), $lte: new Date(endDate + 'T23:59:59.999Z') },
    };

    const entries = await TimeEntry.find(matchStage)
      .populate('user', 'firstName lastName')
      .populate('task', 'title')
      .sort({ startTime: 1 })
      .lean();

    // Build CSV
    const header = 'Date,Member,Task,Description,Duration (hours),Billable';
    const rows = entries.map((e) => {
      const date = new Date(e.startTime).toISOString().split('T')[0];
      const member = `${e.user?.firstName || ''} ${e.user?.lastName || ''}`.trim();
      const task = e.task?.title || 'No Task';
      const desc = (e.description || '').replace(/"/g, '""');
      const hours = Math.round(((e.duration - e.totalBreakDuration) / 3600) * 100) / 100;
      const billable = e.isBillable ? 'Yes' : 'No';
      return `${date},"${member}","${task}","${desc}",${hours},${billable}`;
    });

    const csv = [header, ...rows].join('\n');

    logger.info(`Client report exported: project=${projectId}, entries=${entries.length}`);
    return { csv, projectName: project.name };
  }
}

const clientService = new ClientService();
export default clientService;
