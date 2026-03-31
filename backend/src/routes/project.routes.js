import { Router } from 'express';
import * as projectController from '../controllers/project.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.js';
import {
  createProjectSchema,
  updateProjectSchema,
  getProjectSchema,
  listProjectsSchema,
  addMembersSchema,
  removeMemberSchema,
  projectSummarySchema,
} from '../validators/project.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// CRUD
router.post('/', authorize('manager', 'superadmin'), validate(createProjectSchema), projectController.createProject);
router.get('/', validate(listProjectsSchema), projectController.listProjects);
router.get('/:id', validate(getProjectSchema), projectController.getProject);
router.patch('/:id', validate(updateProjectSchema), projectController.updateProject);
router.delete('/:id', authorize('superadmin'), validate(getProjectSchema), projectController.deleteProject);

// Members
router.post('/:id/members', validate(addMembersSchema), projectController.addMembers);
router.delete('/:id/members/:userId', validate(removeMemberSchema), projectController.removeMember);

// Summary
router.get('/:id/summary', validate(projectSummarySchema), projectController.getProjectSummary);

export default router;
