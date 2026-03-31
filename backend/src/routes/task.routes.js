import { Router } from 'express';
import * as taskController from '../controllers/task.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.js';
import {
  createTaskSchema,
  updateTaskSchema,
  deleteTaskSchema,
  listTasksSchema,
  myTasksSchema,
} from '../validators/task.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Cross-project: my tasks
router.get('/my', validate(myTasksSchema), taskController.getMyTasks);

// Project-scoped tasks
router.post('/project/:projectId', validate(createTaskSchema), taskController.createTask);
router.get('/project/:projectId', validate(listTasksSchema), taskController.listTasks);

// Single task CRUD
router.patch('/:id', validate(updateTaskSchema), taskController.updateTask);
router.delete('/:id', validate(deleteTaskSchema), taskController.deleteTask);

export default router;
