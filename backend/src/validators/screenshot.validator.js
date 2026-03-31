import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const uploadSchema = z.object({
  body: z.object({
    timeEntry: objectId,
  }),
});

export const getByIdSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

export const getByTimeEntrySchema = z.object({
  params: z.object({
    timeEntryId: objectId,
  }),
});
