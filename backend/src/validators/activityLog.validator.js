import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

const activeWindowSchema = z.object({
  appName: z.string().trim().min(1).max(255),
  windowTitle: z.string().trim().max(500).optional().default(''),
  duration: z.number().int().min(0),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
});

const activityLogItemSchema = z.object({
  timeEntry: objectId,
  intervalStart: z.string().datetime(),
  intervalEnd: z.string().datetime(),
  intervalDuration: z.number().int().min(1),
  mouseActivity: z.number().min(0).max(100),
  keyboardActivity: z.number().min(0).max(100),
  overallActivity: z.number().min(0).max(100),
  activeWindows: z.array(activeWindowSchema).max(200).optional().default([]),
  idleTime: z.number().int().min(0).optional().default(0),
  screenshot: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId').optional(),
});

export const batchCreateSchema = z.object({
  body: z.object({
    logs: z.array(activityLogItemSchema).min(1).max(100),
  }),
});

export const getByTimeEntrySchema = z.object({
  params: z.object({
    timeEntryId: objectId,
  }),
});

export const getSummarySchema = z.object({
  query: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }),
});
