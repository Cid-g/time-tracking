import { Router } from 'express';
import * as timeEntryController from '../controllers/timeEntry.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.js';
import {
  startTimerSchema,
  stopTimerSchema,
  timerActionSchema,
  createManualEntrySchema,
  updateTimeEntrySchema,
  deleteTimeEntrySchema,
  getTimeEntrySchema,
  listTimeEntriesSchema,
  summaryQuerySchema,
} from '../validators/timeEntry.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Timer actions
router.post('/timer/start', validate(startTimerSchema), timeEntryController.startTimer);
router.patch('/timer/:id/stop', validate(stopTimerSchema), timeEntryController.stopTimer);
router.patch('/timer/:id/pause', validate(timerActionSchema), timeEntryController.pauseTimer);
router.patch('/timer/:id/resume', validate(timerActionSchema), timeEntryController.resumeTimer);
router.get('/timer/active', timeEntryController.getActiveTimer);

// Manual entry
router.post('/manual', validate(createManualEntrySchema), timeEntryController.createManualEntry);

// CRUD
router.get('/', validate(listTimeEntriesSchema), timeEntryController.listEntries);
router.get('/summary', validate(summaryQuerySchema), timeEntryController.getSummary);
router.get('/daily-breakdown', validate(summaryQuerySchema), timeEntryController.getDailyBreakdown);
router.get('/:id', validate(getTimeEntrySchema), timeEntryController.getEntry);
router.patch('/:id', validate(updateTimeEntrySchema), timeEntryController.updateEntry);
router.delete('/:id', validate(deleteTimeEntrySchema), timeEntryController.deleteEntry);

export default router;
