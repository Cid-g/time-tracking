import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

const tagsSchema = z
  .array(z.string().trim().max(30, 'Tag must be 30 characters or less'))
  .max(10, 'Maximum 10 tags allowed')
  .optional();

// Start timer — minimal payload, just a description and optional metadata
export const startTimerSchema = z.object({
  body: z.object({
    description: z.string().trim().max(500).optional().default(''),
    project: objectId.optional(),
    task: objectId.optional(),
    tags: tagsSchema,
    isBillable: z.boolean().optional(),
  }),
});

// Stop timer — no body needed, just params
export const stopTimerSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

// Pause / resume — just params
export const timerActionSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

// Manual time entry — requires start + end
export const createManualEntrySchema = z.object({
  body: z
    .object({
      description: z.string().trim().max(500).optional().default(''),
      project: objectId.optional(),
      task: objectId.optional(),
      startTime: z.string().datetime({ message: 'Start time must be a valid ISO 8601 date' }),
      endTime: z.string().datetime({ message: 'End time must be a valid ISO 8601 date' }),
      tags: tagsSchema,
      isBillable: z.boolean().optional(),
    })
    .refine(
      (data) => new Date(data.endTime) > new Date(data.startTime),
      { message: 'End time must be after start time', path: ['endTime'] }
    )
    .refine(
      (data) => {
        const diffMs = new Date(data.endTime) - new Date(data.startTime);
        return diffMs <= 24 * 60 * 60 * 1000; // max 24 hours
      },
      { message: 'Time entry cannot exceed 24 hours', path: ['endTime'] }
    )
    .refine(
      (data) => new Date(data.startTime) <= new Date(),
      { message: 'Start time cannot be in the future', path: ['startTime'] }
    ),
});

// Update time entry
export const updateTimeEntrySchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z
    .object({
      description: z.string().trim().max(500).optional(),
      project: objectId.nullable().optional(),
      task: objectId.nullable().optional(),
      startTime: z.string().datetime().optional(),
      endTime: z.string().datetime().optional(),
      tags: tagsSchema,
      isBillable: z.boolean().optional(),
    })
    .refine(
      (data) => {
        if (data.startTime && data.endTime) {
          return new Date(data.endTime) > new Date(data.startTime);
        }
        return true;
      },
      { message: 'End time must be after start time', path: ['endTime'] }
    ),
});

// Delete time entry
export const deleteTimeEntrySchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

// Get single time entry
export const getTimeEntrySchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

// Summary / daily breakdown query params
export const summaryQuerySchema = z.object({
  query: z.object({
    startDate: z.string().datetime({ message: 'Start date must be a valid ISO 8601 date' }),
    endDate: z.string().datetime({ message: 'End date must be a valid ISO 8601 date' }),
  }).refine(
    (data) => new Date(data.endDate) >= new Date(data.startDate),
    { message: 'End date must be on or after start date', path: ['endDate'] }
  ),
});

// List / query time entries
export const listTimeEntriesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    project: objectId.optional(),
    status: z.enum(['running', 'paused', 'completed']).optional(),
    sortBy: z.enum(['startTime', 'duration', 'createdAt']).optional().default('startTime'),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});
