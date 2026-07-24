import * as z from 'zod';

import { finnishIsmnPublisherString } from '../common-validation-regex.ts';

export const createIsmnPublisherRangeSchema = z
  .object({
    publisher_identifier: z.string().regex(finnishIsmnPublisherString),
    ismn_range_id: z.number(),
    monograph_publisher_id: z.number(),
  })
  .strict();

export const getIsmnPublisherRangeIdentifiersSchema = z
  .object({
    download: z.boolean().optional(),
    unassigned_only: z.boolean().optional(),
    assigned_only: z.boolean().optional(),
    limit: z.number().optional(),
    offset: z.number().optional(),
    turnstile_token: z.string().optional(),
  })
  .strict();

export type CreateIsmnPublisherRangeHttp = z.infer<typeof createIsmnPublisherRangeSchema>;
export type GetIsmnPublisherRangeIdentifiersHttp = z.infer<typeof getIsmnPublisherRangeIdentifiersSchema>;
