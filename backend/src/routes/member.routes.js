import { Router } from 'express';
import * as memberController from '../controllers/member.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.js';
import {
  productivityScoreSchema,
  peerComparisonSchema,
  activityHeatmapSchema,
  topAppsSchema,
  breakAnalyticsSchema,
  breakRecommendationsSchema,
  updateBreakSettingsSchema,
} from '../validators/member.validator.js';

const router = Router();

router.use(authenticate);
router.use(authorize('member', 'manager', 'superadmin'));

// =============================================
// Module 6: Productivity Pulse
// =============================================
router.get('/productivity/score', validate(productivityScoreSchema), memberController.getProductivityScore);
router.get('/productivity/peer-comparison', validate(peerComparisonSchema), memberController.getPeerComparison);
router.get('/productivity/heatmap', validate(activityHeatmapSchema), memberController.getActivityHeatmap);
router.get('/productivity/apps', validate(topAppsSchema), memberController.getTopApps);

// =============================================
// Module 7: Break Analytics
// =============================================
router.get('/breaks/analytics', validate(breakAnalyticsSchema), memberController.getBreakAnalytics);
router.get('/breaks/recommendations', validate(breakRecommendationsSchema), memberController.getBreakRecommendations);
router.get('/breaks/settings', memberController.getBreakSettings);
router.patch('/breaks/settings', validate(updateBreakSettingsSchema), memberController.updateBreakSettings);

export default router;
