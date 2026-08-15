import * as z from 'zod';

import { finnishIsmnPublisherString } from '../common-validation-regex.ts';

export const createIsmnPublisherRangeSchema = z
  .object({
    publisher_identifier: z.string().regex(finnishIsmnPublisherString),
    ismn_range_id: z.number(),
    monograph_publisher_id: z.number(),
  })
  .strict();

export type CreateIsmnPublisherRangeHttp = z.infer<typeof createIsmnPublisherRangeSchema>;
