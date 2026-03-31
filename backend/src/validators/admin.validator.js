import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

// =============================================
// Module 25: Timesheet Explorer
// =============================================

export const listTimesheetsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(25),
    userId: objectId.optional(),
    projectId: objectId.optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.enum(['running', 'paused', 'completed']).optional(),
    search: z.string().trim().max(100).optional(),
    sort: z.enum(['startTime', 'duration', 'user']).optional().default('startTime'),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

export const editTimeEntrySchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    updates: z
      .object({
        description: z.string().trim().max(500).optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        project: objectId.nullable().optional(),
        task: objectId.nullable().optional(),
        isBillable: z.boolean().optional(),
      })
      .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one update field is required',
      }),
    reason: z.string().trim().min(1, 'Audit reason is required').max(500),
  }),
});

export const exportTimesheetsSchema = z.object({
  query: z.object({
    format: z.enum(['csv', 'json']).optional().default('csv'),
    userId: objectId.optional(),
    projectId: objectId.optional(),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
  }),
});

export const complianceCheckSchema = z.object({
  body: z.object({
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    userId: objectId.optional(),
    maxDailyHours: z.coerce.number().min(1).max(24).optional().default(8),
    flagWeekends: z.boolean().optional().default(true),
  }),
});

export const bulkTimesheetActionSchema = z.object({
  body: z.object({
    action: z.enum(['flag', 'unflag']),
    entryIds: z.array(objectId).min(1, 'At least one entry required').max(100),
    reason: z.string().trim().min(1, 'Reason is required').max(500),
  }),
});

// =============================================
// Module 26: Approvals Hub
// =============================================

export const listApprovalsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
    status: z.enum(['submitted', 'approved', 'rejected']).optional(),
    userId: objectId.optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    sort: z.enum(['submittedAt', 'totalDuration', 'status']).optional().default('submittedAt'),
  }),
});

export const bulkApprovalActionSchema = z.object({
  body: z
    .object({
      action: z.enum(['approve', 'reject']),
      submissionIds: z.array(objectId).min(1, 'At least one submission required').max(50),
      comment: z.string().trim().max(500).optional().default(''),
    })
    .refine(
      (data) => data.action !== 'reject' || data.comment.length > 0,
      { message: 'Comment is required when rejecting', path: ['comment'] }
    ),
});

export const delegateApprovalSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    delegateToId: objectId,
    comment: z.string().trim().max(500).optional().default(''),
  }),
});

export const approvalHistorySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

// =============================================
// Module 27: Audit Trail
// =============================================

export const listAuditLogsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(25),
    action: z.string().optional(),
    userId: objectId.optional(),
    targetType: z.enum(['TimeEntry', 'Submission', 'User', 'Project']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const auditLogIdSchema = z.object({
  params: z.object({ id: objectId }),
});

export const exportAuditLogsSchema = z.object({
  query: z.object({
    format: z.enum(['csv', 'json']).optional().default('csv'),
    action: z.string().optional(),
    userId: objectId.optional(),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
  }),
});

export const anomalyDetectionSchema = z.object({
  query: z.object({
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    failedLoginThreshold: z.coerce.number().int().min(1).optional().default(5),
    massDeletionThreshold: z.coerce.number().int().min(1).optional().default(10),
  }),
});

// =============================================
// Module 28: Productivity Trends
// =============================================

export const productivityTrendsSchema = z.object({
  query: z.object({
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    userId: objectId.optional(),
    projectId: objectId.optional(),
    groupBy: z.enum(['user', 'project', 'day']).optional().default('user'),
    hourlyRate: z.coerce.number().min(0).optional().default(0),
  }),
});

export const productivityTrendsExportSchema = z.object({
  query: z.object({
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    userId: objectId.optional(),
    projectId: objectId.optional(),
    groupBy: z.enum(['user', 'project', 'day']).optional().default('user'),
    hourlyRate: z.coerce.number().min(0).optional().default(0),
    format: z.enum(['csv', 'json']).optional().default('csv'),
  }),
});

// =============================================
// Module 29: Activity Levels
// =============================================

export const activityLevelsSchema = z.object({
  query: z.object({
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    userId: objectId.optional(),
    minActivity: z.coerce.number().min(0).max(100).optional(),
    maxActivity: z.coerce.number().min(0).max(100).optional(),
  }),
});

export const activityHeatmapSchema = z.object({
  query: z.object({
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    userId: objectId.optional(),
  }),
});

// =============================================
// Module 30: App & Website Usage
// =============================================

export const appUsageSchema = z.object({
  query: z.object({
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    userId: objectId.optional(),
    limit: z.coerce.number().int().min(1).max(100).optional().default(25),
  }),
});
