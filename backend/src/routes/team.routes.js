import { Router } from 'express';
import * as teamController from '../controllers/team.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.js';
import {
  listMembersSchema,
  memberIdSchema,
  updateRoleSchema,
  updateStatusSchema,
  inviteMemberSchema,
  listActivitySchema,
  listTeamTimesheetsSchema,
  teamTimesheetActionSchema,
  rejectTeamTimesheetSchema,
  analyticsRangeSchema,
  trendsSchema,
} from '../validators/team.validator.js';

const router = Router();

router.use(authenticate);
router.use(authorize('manager', 'superadmin'));

// Team KPI stats
router.get('/stats', teamController.getStats);

// Invite new member
router.post('/invite', validate(inviteMemberSchema), teamController.inviteMember);

// Activity feed
router.get('/activity', validate(listActivitySchema), teamController.getActivityFeed);

// Live status (who's online now)
router.get('/activity/live', teamController.getLiveStatus);

// Team timesheets
router.get('/timesheets', validate(listTeamTimesheetsSchema), teamController.getTeamTimesheets);

// Quick approve/reject timesheets
router.patch(
  '/timesheets/:id/approve',
  validate(teamTimesheetActionSchema),
  teamController.approveTeamTimesheet
);
router.patch(
  '/timesheets/:id/reject',
  validate(rejectTeamTimesheetSchema),
  teamController.rejectTeamTimesheet
);

// Analytics
router.get('/analytics/hours', validate(analyticsRangeSchema), teamController.getHoursBreakdown);
router.get('/analytics/projects', validate(analyticsRangeSchema), teamController.getProjectDistribution);
router.get('/analytics/trends', validate(trendsSchema), teamController.getWeeklyTrends);

// List team members
router.get('/', validate(listMembersSchema), teamController.listMembers);

// Get single member detail
router.get('/:id', validate(memberIdSchema), teamController.getMember);

// Change role — superadmin only
router.patch(
  '/:id/role',
  authorize('superadmin'),
  validate(updateRoleSchema),
  teamController.updateRole
);

// Activate/deactivate member
router.patch(
  '/:id/status',
  validate(updateStatusSchema),
  teamController.updateStatus
);

export default router;
