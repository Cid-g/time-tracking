import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const listMembersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
    role: z.enum(['member', 'manager', 'superadmin', 'client']).optional(),
    status: z.enum(['active', 'inactive']).optional(),
    search: z.string().trim().max(100).optional(),
    projectId: objectId.optional(),
  }),
});

export const memberIdSchema = z.object({
  params: z.object({ id: objectId }),
});

export const updateRoleSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    role: z.enum(['member', 'manager', 'client']),
  }),
});

export const updateStatusSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    isActive: z.boolean(),
  }),
});

// Phase 6B validators
export const listActivitySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
    memberId: objectId.optional(),
    projectId: objectId.optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const listTeamTimesheetsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
    memberId: objectId.optional(),
    status: z
      .enum(['draft', 'submitted', 'approved', 'rejected'])
      .optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const teamTimesheetActionSchema = z.object({
  params: z.object({ id: objectId }),
});

export const rejectTeamTimesheetSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    comment: z.string().trim().min(1, 'Rejection reason is required').max(500),
  }),
});

// Phase 6C validators
export const analyticsRangeSchema = z.object({
  query: z.object({
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
  }),
});

export const trendsSchema = z.object({
  query: z.object({
    weeksBack: z.coerce.number().int().min(1).max(52).optional().default(8),
  }),
});

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email required').toLowerCase().trim(),
    firstName: z.string().trim().min(1, 'First name is required').max(50),
    lastName: z.string().trim().min(1, 'Last name is required').max(50),
    role: z.enum(['member', 'manager', 'client']).optional().default('member'),
    projectIds: z.array(objectId).max(20).optional().default([]),
  }),
});
