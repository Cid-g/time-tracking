import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

const tagsSchema = z
  .array(z.string().trim().max(30, 'Tag must be 30 characters or less'))
  .max(10, 'Maximum 10 tags allowed')
  .optional();

// Create task (under a project)
export const createTaskSchema = z.object({
  params: z.object({ projectId: objectId }),
  body: z.object({
    title: z.string().trim().min(1, 'Task title is required').max(200),
    description: z.string().trim().max(2000).optional().default(''),
    assignees: z.array(objectId).optional().default([]),
    status: z.enum(['todo', 'in_progress', 'in_review', 'completed']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    estimatedHours: z.number().min(0).optional(),
    dueDate: z.string().datetime().optional(),
    tags: tagsSchema,
  }),
});

// Update task
export const updateTaskSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).optional(),
    assignees: z.array(objectId).optional(),
    status: z.enum(['todo', 'in_progress', 'in_review', 'completed']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    estimatedHours: z.number().min(0).nullable().optional(),
    dueDate: z.string().datetime().nullable().optional(),
    tags: tagsSchema,
  }),
});

// Delete task
export const deleteTaskSchema = z.object({
  params: z.object({ id: objectId }),
});

// List tasks for a project
export const listTasksSchema = z.object({
  params: z.object({ projectId: objectId }),
  query: z.object({
    status: z.enum(['todo', 'in_progress', 'in_review', 'completed']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    assignee: objectId.optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  }),
});

// My tasks across all projects
export const myTasksSchema = z.object({
  query: z.object({
    status: z.enum(['todo', 'in_progress', 'in_review', 'completed']).optional(),
    projectId: objectId.optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  }),
});
