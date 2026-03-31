import teamService from '../services/team.service.js';
import catchAsync from '../utils/catchAsync.js';

export const listMembers = catchAsync(async (req, res) => {
  const result = await teamService.listMembers(req.user._id, req.user.role, req.query);
  res.json({ success: true, data: result });
});

export const getMember = catchAsync(async (req, res) => {
  const result = await teamService.getMember(req.params.id, req.user._id, req.user.role);
  res.json({ success: true, data: result });
});

export const updateRole = catchAsync(async (req, res) => {
  const member = await teamService.updateRole(req.params.id, req.body.role, req.user._id);
  res.json({ success: true, data: { member } });
});

export const updateStatus = catchAsync(async (req, res) => {
  const member = await teamService.updateStatus(
    req.params.id,
    req.body.isActive,
    req.user._id,
    req.user.role
  );
  res.json({ success: true, data: { member } });
});

export const inviteMember = catchAsync(async (req, res) => {
  const member = await teamService.inviteMember(req.user._id, req.body);
  res.status(201).json({ success: true, data: { member } });
});

export const getStats = catchAsync(async (req, res) => {
  const stats = await teamService.getStats(req.user._id, req.user.role);
  res.json({ success: true, data: { stats } });
});

// Phase 6B
export const getActivityFeed = catchAsync(async (req, res) => {
  const result = await teamService.getActivityFeed(req.user._id, req.user.role, req.query);
  res.json({ success: true, data: result });
});

export const getLiveStatus = catchAsync(async (req, res) => {
  const result = await teamService.getLiveStatus(req.user._id, req.user.role);
  res.json({ success: true, data: result });
});

export const getTeamTimesheets = catchAsync(async (req, res) => {
  const result = await teamService.getTeamTimesheets(req.user._id, req.user.role, req.query);
  res.json({ success: true, data: result });
});

export const approveTeamTimesheet = catchAsync(async (req, res) => {
  const submission = await teamService.approveTeamTimesheet(
    req.params.id,
    req.user._id,
    req.user.role
  );
  res.json({ success: true, data: { submission } });
});

export const rejectTeamTimesheet = catchAsync(async (req, res) => {
  const submission = await teamService.rejectTeamTimesheet(
    req.params.id,
    req.user._id,
    req.user.role,
    req.body.comment
  );
  res.json({ success: true, data: { submission } });
});

// Phase 6C
export const getHoursBreakdown = catchAsync(async (req, res) => {
  const result = await teamService.getHoursBreakdown(req.user._id, req.user.role, req.query);
  res.json({ success: true, data: result });
});

export const getProjectDistribution = catchAsync(async (req, res) => {
  const result = await teamService.getProjectDistribution(req.user._id, req.user.role, req.query);
  res.json({ success: true, data: result });
});

export const getWeeklyTrends = catchAsync(async (req, res) => {
  const result = await teamService.getWeeklyTrends(req.user._id, req.user.role, req.query);
  res.json({ success: true, data: result });
});
