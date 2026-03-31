import { Router } from 'express';
import authRoutes from './auth.routes.js';
import timeEntryRoutes from './timeEntry.routes.js';
import projectRoutes from './project.routes.js';
import taskRoutes from './task.routes.js';
import activityLogRoutes from './activityLog.routes.js';
import submissionRoutes from './submission.routes.js';
import teamRoutes from './team.routes.js';
import adminRoutes from './admin.routes.js';
import screenshotRoutes from './screenshot.routes.js';
import clientRoutes from './client.routes.js';
import memberRoutes from './member.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/time-entries', timeEntryRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/activity-logs', activityLogRoutes);
router.use('/submissions', submissionRoutes);
router.use('/team', teamRoutes);
router.use('/admin', adminRoutes);
router.use('/screenshots', screenshotRoutes);
router.use('/client', clientRoutes);
router.use('/member', memberRoutes);

export default router;
