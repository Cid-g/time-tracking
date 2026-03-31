import { z } from 'zod';

const periodSchema = z.enum(['7d', '14d', '30d']).optional().default('7d');

// =============================================
// Module 6: Productivity Pulse
// =============================================

export const productivityScoreSchema = z.object({
  query: z.object({
    period: periodSchema,
  }),
});

export const peerComparisonSchema = z.object({
  query: z.object({
    period: periodSchema,
  }),
});

export const activityHeatmapSchema = z.object({
  query: z.object({
    period: periodSchema,
  }),
});

export const topAppsSchema = z.object({
  query: z.object({
    period: periodSchema,
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  }),
});

// =============================================
// Module 7: Break Analytics
// =============================================

export const breakAnalyticsSchema = z.object({
  query: z.object({
    period: periodSchema,
  }),
});

export const breakRecommendationsSchema = z.object({
  query: z.object({
    period: periodSchema,
  }),
});

export const updateBreakSettingsSchema = z.object({
  body: z
    .object({
      breakInterval: z.number().int().min(30).max(120).optional(),
      breakDuration: z.number().int().min(1).max(15).optional(),
      mode: z.enum(['strict', 'flexible']).optional(),
      enabled: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one setting must be provided',
    }),
});
