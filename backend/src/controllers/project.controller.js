import projectService from '../services/project.service.js';
import catchAsync from '../utils/catchAsync.js';

export const createProject = catchAsync(async (req, res) => {
  const project = await projectService.createProject(req.user._id, req.body);

  res.status(201).json({
    success: true,
    data: { project },
  });
});

export const listProjects = catchAsync(async (req, res) => {
  const result = await projectService.listProjects(req.user._id, req.user.role, req.query);

  res.json({
    success: true,
    data: result,
  });
});

export const getProject = catchAsync(async (req, res) => {
  const project = await projectService.getProject(req.params.id, req.user._id, req.user.role);

  res.json({
    success: true,
    data: { project },
  });
});

export const updateProject = catchAsync(async (req, res) => {
  const project = await projectService.updateProject(req.params.id, req.user._id, req.user.role, req.body);

  res.json({
    success: true,
    data: { project },
  });
});

export const deleteProject = catchAsync(async (req, res) => {
  await projectService.deleteProject(req.params.id);

  res.json({
    success: true,
    message: 'Project archived successfully',
  });
});

export const addMembers = catchAsync(async (req, res) => {
  const project = await projectService.addMembers(req.params.id, req.user._id, req.user.role, req.body.members);

  res.json({
    success: true,
    data: { project },
  });
});

export const removeMember = catchAsync(async (req, res) => {
  const project = await projectService.removeMember(req.params.id, req.user._id, req.user.role, req.params.userId);

  res.json({
    success: true,
    data: { project },
  });
});

export const getProjectSummary = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const summary = await projectService.getProjectSummary(req.params.id, req.user._id, req.user.role, startDate, endDate);

  res.json({
    success: true,
    data: { summary },
  });
});
