import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.js';
import {
  listTimesheetsSchema,
  editTimeEntrySchema,
  exportTimesheetsSchema,
  complianceCheckSchema,
  bulkTimesheetActionSchema,
  listApprovalsSchema,
  bulkApprovalActionSchema,
  delegateApprovalSchema,
  approvalHistorySchema,
  listAuditLogsSchema,
  auditLogIdSchema,
  exportAuditLogsSchema,
  anomalyDetectionSchema,
  productivityTrendsSchema,
  productivityTrendsExportSchema,
  activityLevelsSchema,
  activityHeatmapSchema,
  appUsageSchema,
} from '../validators/admin.validator.js';

const router = Router();

// All admin routes require superadmin
router.use(authenticate);
router.use(authorize('superadmin'));

// =============================================
// Module 25: Timesheet Explorer
// =============================================
router.get('/timesheets/export', validate(exportTimesheetsSchema), adminController.exportTimesheets);
router.get('/timesheets', validate(listTimesheetsSchema), adminController.getTimesheets);
router.patch('/timesheets/:id', validate(editTimeEntrySchema), adminController.editTimeEntry);
router.post('/timesheets/compliance', validate(complianceCheckSchema), adminController.runComplianceCheck);
router.post('/timesheets/bulk', validate(bulkTimesheetActionSchema), adminController.bulkTimesheetAction);

// =============================================
// Module 26: Approvals Hub
// =============================================
router.get('/approvals/history', validate(approvalHistorySchema), adminController.getApprovalHistory);
router.get('/approvals', validate(listApprovalsSchema), adminController.getApprovals);
router.post('/approvals/bulk', validate(bulkApprovalActionSchema), adminController.bulkApprovalAction);
router.post('/approvals/:id/delegate', validate(delegateApprovalSchema), adminController.delegateApproval);

// =============================================
// Module 27: Audit Trail
// =============================================
router.get('/audit-logs/export', validate(exportAuditLogsSchema), adminController.exportAuditLogs);
router.get('/audit-logs/anomalies', validate(anomalyDetectionSchema), adminController.detectAnomalies);
router.get('/audit-logs', validate(listAuditLogsSchema), adminController.getAuditLogs);
router.get('/audit-logs/:id', validate(auditLogIdSchema), adminController.getAuditLogDetail);

// =============================================
// Module 28: Productivity Trends
// =============================================
router.get('/reports/productivity-trends/export', validate(productivityTrendsExportSchema), adminController.exportProductivityTrends);
router.get('/reports/productivity-trends', validate(productivityTrendsSchema), adminController.getProductivityTrends);

// =============================================
// Module 29: Activity Levels
// =============================================
router.get('/reports/activity-levels/heatmap', validate(activityHeatmapSchema), adminController.getActivityHeatmap);
router.get('/reports/activity-levels', validate(activityLevelsSchema), adminController.getActivityLevels);

// =============================================
// Module 30: App & Website Usage
// =============================================
router.get('/reports/app-usage', validate(appUsageSchema), adminController.getAppUsage);

export default router;
