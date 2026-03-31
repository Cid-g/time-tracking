import { Router } from 'express';
import * as submissionController from '../controllers/submission.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.js';
import {
  createSubmissionSchema,
  submitSubmissionSchema,
  reviewSubmissionSchema,
  listSubmissionsSchema,
  bulkSubmitSchema,
  submissionIdSchema,
} from '../validators/submission.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Member routes
router.post('/', validate(createSubmissionSchema), submissionController.createSubmission);
router.get('/', validate(listSubmissionsSchema), submissionController.listMySubmissions);
router.post('/bulk-submit', validate(bulkSubmitSchema), submissionController.bulkSubmit);

// Manager/SuperAdmin routes
router.get(
  '/pending',
  authorize('manager', 'superadmin'),
  validate(listSubmissionsSchema),
  submissionController.listPendingApprovals
);

// Single submission routes
router.get('/:id', validate(submissionIdSchema), submissionController.getSubmission);
router.patch('/:id/submit', validate(submitSubmissionSchema), submissionController.submitSubmission);
router.patch(
  '/:id/review',
  authorize('manager', 'superadmin'),
  validate(reviewSubmissionSchema),
  submissionController.reviewSubmission
);
router.delete('/:id', validate(submissionIdSchema), submissionController.deleteSubmission);

export default router;
