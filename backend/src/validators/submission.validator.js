import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

// Create a draft submission
export const createSubmissionSchema = z.object({
  body: z.object({
    entries: z
      .array(objectId)
      .min(1, 'At least one time entry is required')
      .max(100, 'Maximum 100 entries per submission'),
    period: z.object({
      startDate: z.string().datetime({ message: 'Start date must be a valid ISO 8601 date' }),
      endDate: z.string().datetime({ message: 'End date must be a valid ISO 8601 date' }),
    }).refine(
      (data) => new Date(data.endDate) >= new Date(data.startDate),
      { message: 'End date must be on or after start date', path: ['endDate'] }
    ),
    notes: z.string().trim().max(500).optional().default(''),
  }),
});

// Submit a draft for approval
export const submitSubmissionSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

// Approve or reject a submission (manager/superadmin)
export const reviewSubmissionSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z
    .object({
      action: z.enum(['approved', 'rejected']),
      comment: z.string().trim().max(500).optional().default(''),
    })
    .refine(
      (data) => {
        if (data.action === 'rejected' && (!data.comment || data.comment.trim().length === 0)) {
          return false;
        }
        return true;
      },
      { message: 'A reason is required when rejecting a submission', path: ['comment'] }
    ),
});

// List submissions (query params)
export const listSubmissionsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
    status: z.enum(['draft', 'submitted', 'under_review', 'approved', 'rejected']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

// Bulk submit multiple drafts
export const bulkSubmitSchema = z.object({
  body: z.object({
    submissionIds: z
      .array(objectId)
      .min(1, 'At least one submission ID is required')
      .max(20, 'Maximum 20 submissions per bulk operation'),
  }),
});

// Get or delete a single submission
export const submissionIdSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});
