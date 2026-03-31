import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const listClientProjectsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(12),
    status: z.enum(['active', 'completed', 'on_hold', 'archived']).optional(),
    search: z.string().trim().max(100).optional(),
  }),
});

export const clientProjectParamSchema = z.object({
  params: z.object({ id: objectId }),
});

export const clientProjectReportSchema = z.object({
  params: z.object({ id: objectId }),
  query: z.object({
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    groupBy: z.enum(['member', 'task', 'day']).optional().default('member'),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  }),
});

export const clientReportExportSchema = z.object({
  params: z.object({ id: objectId }),
  query: z.object({
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    groupBy: z.enum(['member', 'task', 'day']).optional().default('member'),
  }),
});
