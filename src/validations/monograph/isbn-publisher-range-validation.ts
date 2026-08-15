import * as z from 'zod';

import { finnishIsbnPublisherString } from '../common-validation-regex.ts';

export const createIsbnPublisherRangeSchema = z
  .object({
    publisher_identifier: z.string().regex(finnishIsbnPublisherString),
    isbn_range_id: z.number(),
    monograph_publisher_id: z.number(),
  })
  .strict();

export type CreateIsbnPublisherRangeHttp = z.infer<typeof createIsbnPublisherRangeSchema>;
