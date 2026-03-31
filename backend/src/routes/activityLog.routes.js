import { Router } from 'express';
import * as activityLogController from '../controllers/activityLog.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.js';
import {
  batchCreateSchema,
  getByTimeEntrySchema,
  getSummarySchema,
} from '../validators/activityLog.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/batch', validate(batchCreateSchema), activityLogController.createBatch);
router.get('/time-entry/:timeEntryId', validate(getByTimeEntrySchema), activityLogController.getByTimeEntry);
router.get('/summary', validate(getSummarySchema), activityLogController.getSummary);

export default router;
