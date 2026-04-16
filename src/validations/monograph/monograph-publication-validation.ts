import * as z from 'zod';

// Allow either updating association or attributes
export const updateMonographPublicationSchema = z
  .object({
    primary_title: z.string().min(1).max(200),
  })
  .strict();

export type UpdateMonographPublicationHttp = z.infer<typeof updateMonographPublicationSchema>;
