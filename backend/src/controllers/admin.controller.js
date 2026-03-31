import adminService from '../services/admin.service.js';
import catchAsync from '../utils/catchAsync.js';

// =============================================
// Module 25: Timesheet Explorer
// =============================================

export const getTimesheets = catchAsync(async (req, res) => {
  const result = await adminService.getTimesheets(req.query);
  res.json({ success: true, data: result });
});

export const editTimeEntry = catchAsync(async (req, res) => {
  const entry = await adminService.editTimeEntry(
    req.params.id,
    req.user._id,
    req.body.updates,
    req.body.reason
  );
  res.json({ success: true, data: { entry } });
});

export const exportTimesheets = catchAsync(async (req, res) => {
  const result = await adminService.exportTimesheets(req.query);

  if (req.query.format === 'json') {
    return res.json({ success: true, data: result });
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=timesheets-export.csv');
  res.send(result);
});

export const runComplianceCheck = catchAsync(async (req, res) => {
  const result = await adminService.runComplianceCheck(req.body);
  res.json({ success: true, data: result });
});

export const bulkTimesheetAction = catchAsync(async (req, res) => {
  const result = await adminService.bulkTimesheetAction(
    req.user._id,
    req.body.action,
    req.body.entryIds,
    req.body.reason
  );
  res.json({ success: true, data: result });
});

// =============================================
// Module 26: Approvals Hub
// =============================================

export const getApprovals = catchAsync(async (req, res) => {
  const result = await adminService.getApprovals(req.query);
  res.json({ success: true, data: result });
});

export const bulkApprovalAction = catchAsync(async (req, res) => {
  const result = await adminService.bulkApprovalAction(
    req.user._id,
    req.body.action,
    req.body.submissionIds,
    req.body.comment
  );
  res.json({ success: true, data: result });
});

export const delegateApproval = catchAsync(async (req, res) => {
  const submission = await adminService.delegateApproval(
    req.params.id,
    req.user._id,
    req.body.delegateToId,
    req.body.comment
  );
  res.json({ success: true, data: { submission } });
});

export const getApprovalHistory = catchAsync(async (req, res) => {
  const result = await adminService.getApprovalHistory(req.query);
  res.json({ success: true, data: result });
});

// =============================================
// Module 27: Audit Trail
// =============================================

export const getAuditLogs = catchAsync(async (req, res) => {
  const result = await adminService.getAuditLogs(req.query);
  res.json({ success: true, data: result });
});

export const getAuditLogDetail = catchAsync(async (req, res) => {
  const log = await adminService.getAuditLogDetail(req.params.id);
  res.json({ success: true, data: { log } });
});

export const exportAuditLogs = catchAsync(async (req, res) => {
  const result = await adminService.exportAuditLogs(req.query);

  if (req.query.format === 'json') {
    return res.json({ success: true, data: result });
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=audit-logs-export.csv');
  res.send(result);
});

export const detectAnomalies = catchAsync(async (req, res) => {
  const result = await adminService.detectAnomalies(req.query);
  res.json({ success: true, data: result });
});

// =============================================
// Module 28: Productivity Trends
// =============================================

export const getProductivityTrends = catchAsync(async (req, res) => {
  const result = await adminService.getProductivityTrends(req.query);
  res.json({ success: true, data: result });
});

export const exportProductivityTrends = catchAsync(async (req, res) => {
  const result = await adminService.exportProductivityTrends(req.query);

  if (req.query.format === 'json') {
    return res.json({ success: true, data: result });
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=productivity-trends-export.csv');
  res.send(result);
});

// =============================================
// Module 29: Activity Levels
// =============================================

export const getActivityLevels = catchAsync(async (req, res) => {
  const result = await adminService.getActivityLevels(req.query);
  res.json({ success: true, data: result });
});

export const getActivityHeatmap = catchAsync(async (req, res) => {
  const result = await adminService.getActivityHeatmap(req.query);
  res.json({ success: true, data: result });
});

// =============================================
// Module 30: App & Website Usage
// =============================================

export const getAppUsage = catchAsync(async (req, res) => {
  const result = await adminService.getAppUsage(req.query);
  res.json({ success: true, data: result });
});
