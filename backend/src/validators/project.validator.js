import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color');

// Create project
export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Project name is required').max(100),
    description: z.string().trim().max(1000).optional().default(''),
    client: objectId.optional(),
    members: z.array(objectId).optional().default([]),
    managers: z.array(objectId).optional().default([]),
    status: z.enum(['active', 'completed', 'archived', 'on_hold']).optional(),
    color: hexColor.optional(),
    billingType: z.enum(['hourly', 'fixed', 'non_billable']).optional(),
    hourlyRate: z.number().min(0).optional(),
    budgetHours: z.number().min(0).optional(),
    budgetAmount: z.number().min(0).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

// Update project
export const updateProjectSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(1000).optional(),
    client: objectId.nullable().optional(),
    status: z.enum(['active', 'completed', 'archived', 'on_hold']).optional(),
    color: hexColor.optional(),
    billingType: z.enum(['hourly', 'fixed', 'non_billable']).optional(),
    hourlyRate: z.number().min(0).nullable().optional(),
    budgetHours: z.number().min(0).nullable().optional(),
    budgetAmount: z.number().min(0).nullable().optional(),
    startDate: z.string().datetime().nullable().optional(),
    endDate: z.string().datetime().nullable().optional(),
  }),
});

// Get single project
export const getProjectSchema = z.object({
  params: z.object({ id: objectId }),
});

// List projects
export const listProjectsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
    status: z.enum(['active', 'completed', 'archived', 'on_hold']).optional(),
    search: z.string().trim().max(100).optional(),
  }),
});

// Add members to project
export const addMembersSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    members: z.array(objectId).min(1, 'At least one member is required'),
  }),
});

// Remove member from project
export const removeMemberSchema = z.object({
  params: z.object({
    id: objectId,
    userId: objectId,
  }),
});

// Project summary query
export const projectSummarySchema = z.object({
  params: z.object({ id: objectId }),
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});
