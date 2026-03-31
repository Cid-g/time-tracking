import { Router } from 'express';
import * as clientController from '../controllers/client.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.js';
import {
  listClientProjectsSchema,
  clientProjectParamSchema,
  clientProjectReportSchema,
  clientReportExportSchema,
} from '../validators/client.validator.js';

const router = Router();

router.use(authenticate);
router.use(authorize('client', 'superadmin'));

// Dashboard
router.get('/dashboard', clientController.getDashboard);

// Projects list
router.get('/projects', validate(listClientProjectsSchema), clientController.listProjects);

// Project detail — specific paths before parameterized
router.get('/projects/:id/report/export', validate(clientReportExportSchema), clientController.exportProjectReport);
router.get('/projects/:id/report', validate(clientProjectReportSchema), clientController.getProjectReport);
router.get('/projects/:id', validate(clientProjectParamSchema), clientController.getProjectDetail);

export default router;
