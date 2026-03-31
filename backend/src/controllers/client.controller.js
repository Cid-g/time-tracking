import clientService from '../services/client.service.js';
import catchAsync from '../utils/catchAsync.js';

export const getDashboard = catchAsync(async (req, res) => {
  const result = await clientService.getDashboard(req.user._id, req.user.role);
  res.json({ success: true, data: result });
});

export const listProjects = catchAsync(async (req, res) => {
  const result = await clientService.listProjects(req.user._id, req.user.role, req.query);
  res.json({ success: true, data: result });
});

export const getProjectDetail = catchAsync(async (req, res) => {
  const result = await clientService.getProjectDetail(req.params.id, req.user._id, req.user.role);
  res.json({ success: true, data: result });
});

export const getProjectReport = catchAsync(async (req, res) => {
  const result = await clientService.getProjectReport(req.params.id, req.user._id, req.user.role, req.query);
  res.json({ success: true, data: result });
});

export const exportProjectReport = catchAsync(async (req, res) => {
  const { csv, projectName } = await clientService.exportProjectReport(
    req.params.id,
    req.user._id,
    req.user.role,
    req.query
  );
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${projectName}-report.csv"`);
  res.send(csv);
});
