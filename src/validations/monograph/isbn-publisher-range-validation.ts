import * as z from 'zod';

import { finnishIsbnPublisherString } from '../common-validation-regex.ts';

export const createIsbnPublisherRangeSchema = z
  .object({
    publisher_identifier: z.string().regex(finnishIsbnPublisherString),
    isbn_range_id: z.number(),
    monograph_publisher_id: z.number(),
  })
  .strict();

export const getIsbnPublisherRangeIdentifiersSchema = z.object({
  download: z.boolean().optional(),
  unassigned_only: z.boolean().optional(),
  assigned_only: z.boolean().optional(),
  limit: z.number(),
  offset: z.number(),
  // TODO: turnstile_token
});

export type CreateIsbnPublisherRangeHttp = z.infer<typeof createIsbnPublisherRangeSchema>;
export type GetIsbnPublisherRangeIdentifiersHttp = z.infer<typeof getIsbnPublisherRangeIdentifiersSchema>;
