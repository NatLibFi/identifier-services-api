import * as z from 'zod';

export const updateMonographPublicationSchema = z
  .object({
    primary_title: z.string().min(1).max(200),
  })
  .strict();

export const searchMonographPublicationSchema = z
  .object({
    search_text: z.string().max(100).optional(),
    monograph_publisher_id: z.number().optional(),
    limit: z.number().min(1).max(10), // Note: limit is made low because each entry will result into a normal interface read operation
    offset: z.number().min(0).max(100000),
  })
  .strict();

export const mergeMonographPublicationSchema = z.object({ incoming_monograph_publication_id: z.number() }).strict();

export type UpdateMonographPublicationHttp = z.infer<typeof updateMonographPublicationSchema>;
export type SearchMonographPublicationHttp = z.infer<typeof searchMonographPublicationSchema>;
