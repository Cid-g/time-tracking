import taskService from '../services/task.service.js';
import catchAsync from '../utils/catchAsync.js';

export const createTask = catchAsync(async (req, res) => {
  const task = await taskService.createTask(req.params.projectId, req.user._id, req.user.role, req.body);

  res.status(201).json({
    success: true,
    data: { task },
  });
});

export const listTasks = catchAsync(async (req, res) => {
  const result = await taskService.listTasks(req.params.projectId, req.user._id, req.user.role, req.query);

  res.json({
    success: true,
    data: result,
  });
});

export const getMyTasks = catchAsync(async (req, res) => {
  const result = await taskService.getMyTasks(req.user._id, req.query);

  res.json({
    success: true,
    data: result,
  });
});

export const updateTask = catchAsync(async (req, res) => {
  const task = await taskService.updateTask(req.params.id, req.user._id, req.user.role, req.body);

  res.json({
    success: true,
    data: { task },
  });
});

export const deleteTask = catchAsync(async (req, res) => {
  await taskService.deleteTask(req.params.id, req.user._id, req.user.role);

  res.json({
    success: true,
    message: 'Task deleted successfully',
  });
});
